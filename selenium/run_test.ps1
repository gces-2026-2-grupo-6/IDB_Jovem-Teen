param(
    [string]$TestPath = "testes\test_bugs_encontrados.py"
)

$ErrorActionPreference = "Stop"

$seleniumDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $seleniumDir
$backendRoot = Join-Path (Split-Path -Parent $projectRoot) "IDB_Jovem-Backend"
$testFile = if ([System.IO.Path]::IsPathRooted($TestPath)) {
    $TestPath
} else {
    Join-Path $seleniumDir $TestPath
}
$venvPython = Join-Path $seleniumDir ".venv\Scripts\python.exe"
$requirements = Join-Path $seleniumDir "requirements.txt"
$composeSource = Join-Path $seleniumDir "ambiente\docker-compose.yml"
$keycloakSetup = Join-Path $seleniumDir "ambiente\preparar_keycloak.py"
$viteCli = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
$node = (Get-Command node -ErrorAction Stop).Source
$projectName = "selenium-run-$PID"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) $projectName
$composeFile = Join-Path $tempRoot "docker-compose.yml"
$frontendProcess = $null
$composeStarted = $false
$exitCode = 1

function Get-FreePort([int]$PreferredPort) {
    $port = $PreferredPort
    while ($port -lt 65000) {
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
            $port++
            continue
        }

        $listener = [System.Net.Sockets.TcpListener]::new(
            [System.Net.IPAddress]::Any,
            $port
        )
        try {
            $listener.Start()
            return $port
        } catch {
            $port++
        } finally {
            $listener.Stop()
        }
    }

    throw "Não foi possível encontrar uma porta livre próxima de $PreferredPort."
}

function Wait-ForHttp([string]$Url, [int]$TimeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                return
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    } while ((Get-Date) -lt $deadline)

    throw "O serviço não respondeu a tempo: $Url"
}

try {
    if (-not (Test-Path $backendRoot)) {
        throw "Repositório do back-end não encontrado em $backendRoot."
    }
    if (-not (Test-Path $testFile)) {
        throw "Teste não encontrado: $testFile"
    }
    if (-not (Test-Path $viteCli)) {
        throw "Vite não encontrado. Instale as dependências do front-end com npm install."
    }

    if (-not (Test-Path $venvPython)) {
        $pythonLauncher = Get-Command py -ErrorAction SilentlyContinue
        if ($pythonLauncher) {
            & $pythonLauncher.Source -3 -m venv (Join-Path $seleniumDir ".venv")
        } else {
            & (Get-Command python -ErrorAction Stop).Source -m venv (Join-Path $seleniumDir ".venv")
        }
        if ($LASTEXITCODE -ne 0) {
            throw "Não foi possível criar o ambiente virtual Python."
        }
    }

    & $venvPython -c "import pytest, requests, selenium" 2>$null
    if ($LASTEXITCODE -ne 0) {
        & $venvPython -m pip install -r $requirements
        if ($LASTEXITCODE -ne 0) {
            throw "Não foi possível instalar as dependências do Selenium."
        }
    }

    $dockerCommand = Get-Command docker -ErrorAction Stop
    & $dockerCommand.Source info *> $null
    if ($LASTEXITCODE -ne 0) {
        $desktopCandidates = @(
            (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"),
            (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe")
        )
        $desktop = $desktopCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
        if ($desktop) {
            Start-Process -FilePath $desktop | Out-Null
        }

        $dockerDeadline = (Get-Date).AddMinutes(3)
        do {
            Start-Sleep -Seconds 5
            & $dockerCommand.Source info *> $null
        } while ($LASTEXITCODE -ne 0 -and (Get-Date) -lt $dockerDeadline)
        if ($LASTEXITCODE -ne 0) {
            throw "Docker não está disponível. Inicie o Docker Desktop e tente novamente."
        }
    }

    $frontendPort = Get-FreePort 5173
    $apiPort = Get-FreePort 8000
    $keycloakPort = Get-FreePort 8080
    $frontendUrl = "http://localhost:$frontendPort"
    $apiUrl = "http://localhost:$apiPort"
    $keycloakUrl = "http://localhost:$keycloakPort"

    $buildContext = Join-Path $tempRoot "backend"
    New-Item -ItemType Directory -Path (Join-Path $buildContext "keycloak") -Force | Out-Null
    Copy-Item (Join-Path $backendRoot "Dockerfile") $buildContext
    Set-Content -Path (Join-Path $buildContext ".dockerignore") -Value "" -Encoding ascii
    foreach ($file in @("requirements.txt", "alembic.ini")) {
        Copy-Item (Join-Path $backendRoot $file) $buildContext
    }
    foreach ($directory in @("src", "migrations")) {
        Copy-Item (Join-Path $backendRoot $directory) $buildContext -Recurse
    }
    Copy-Item (Join-Path $backendRoot "keycloak\realm.json") (Join-Path $buildContext "keycloak")

    $compose = Get-Content $composeSource -Raw
    $compose = $compose.Replace("8080:8080", "$($keycloakPort):8080")
    $compose = $compose.Replace("8000:8000", "$($apiPort):8000")
    $compose = $compose.Replace("localhost:8080/realms/jovem", "localhost:$($keycloakPort)/realms/jovem")
    $compose = $compose.Replace("http://localhost:5173", $frontendUrl)
    Set-Content -Path $composeFile -Value $compose -Encoding utf8

    $env:BACKEND_DIR = $buildContext
    $composeStarted = $true
    & $dockerCommand.Source compose -p $projectName -f $composeFile up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível iniciar os serviços Selenium."
    }

    $env:KEYCLOAK_URL = $keycloakUrl
    & $venvPython -I $keycloakSetup
    if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível preparar os usuários de teste no Keycloak."
    }

    $env:VITE_API_URL = $apiUrl
    $env:VITE_KEYCLOAK_URL = $keycloakUrl
    $env:VITE_KEYCLOAK_REALM = "jovem"
    $env:VITE_KEYCLOAK_CLIENT_ID = "jovem-backend"
    $frontendProcess = Start-Process -FilePath $node `
        -ArgumentList @($viteCli, "--host", "127.0.0.1", "--port", "$frontendPort", "--strictPort") `
        -WorkingDirectory $projectRoot -PassThru `
        -RedirectStandardOutput (Join-Path $tempRoot "vite.log") `
        -RedirectStandardError (Join-Path $tempRoot "vite-error.log")

    Wait-ForHttp "$frontendUrl/" 60
    Wait-ForHttp "$apiUrl/evento/" 180
    Wait-ForHttp "$keycloakUrl/realms/jovem" 180

    $env:FRONT_URL = $frontendUrl
    $env:API_URL = $apiUrl
    $env:KEYCLOAK_URL = $keycloakUrl
    & $venvPython -m pytest $testFile -v
    $exitCode = $LASTEXITCODE
} catch {
    Write-Error $_
    $exitCode = 1
} finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($composeStarted) {
        & $dockerCommand.Source compose -p $projectName -f $composeFile down
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "A limpeza dos containers do Selenium terminou com erro."
        }
    }
    if (Test-Path $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

exit $exitCode
