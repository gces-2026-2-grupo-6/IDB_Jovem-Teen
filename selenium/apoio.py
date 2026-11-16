"""Apoio comum aos testes funcionais: configuração, esperas e acesso à API.

Os testes navegam no front de verdade, logado pelo Keycloak de verdade e
falando com o back-end de verdade. A API é usada só para preparar os dados de
cada cenário (e apagá-los no final), nunca para verificar a tela.
"""

import os
import time
import uuid
from datetime import datetime, timedelta

import requests
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

FRONT_URL = os.environ.get("FRONT_URL", "http://localhost:5173").rstrip("/")
API_URL = os.environ.get("API_URL", "http://localhost:8000").rstrip("/")
KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", "http://localhost:8080").rstrip("/")
REALM = os.environ.get("KEYCLOAK_REALM", "jovem")
CLIENT_ID = os.environ.get("KEYCLOAK_CLIENT_ID", "jovem-backend")
SENHA = os.environ.get("SENHA_TESTES", "selenium123")
ESPERA_S = int(os.environ.get("ESPERA_S", "15"))
# Pausa opcional depois de cada clique e campo preenchido, só para
# demonstração (PAUSA_S=0.8 HEADLESS=0). Zero por padrão.
PAUSA_S = float(os.environ.get("PAUSA_S", "0"))

# Usuários criados por ambiente/preparar_keycloak.py, um por perfil.
PERFIS = {
    "super": "selenium-super",
    "eventos": "selenium-eventos",
    "produtos": "selenium-produtos",
    "inscricoes": "selenium-inscricoes",
}

# Missão já publicada no rodapé, antes da US22.
MISSAO_PUBLICADA = "Inspirar e capacitar as novas gerações"


def marca():
    """Prefixo único por execução, para os dados de um teste não se misturarem
    com os de outro (nem com dados que alguém tenha criado à mão)."""
    return f"[selenium {uuid.uuid4().hex[:6]}]"


def iso(data):
    return data.strftime("%Y-%m-%dT%H:%M:%S")


def dias_a_partir_de_hoje(dias, hora=19):
    base = datetime.now().replace(hour=hora, minute=0, second=0, microsecond=0)
    return base + timedelta(days=dias)


def no_mes_anterior(dia=10, hora=19):
    hoje = datetime.now()
    primeiro = hoje.replace(day=1, hour=hora, minute=0, second=0, microsecond=0)
    return (primeiro - timedelta(days=1)).replace(day=dia)


# ------------------------------------------------------------------ esperas


def esperar(driver, condicao, segundos=ESPERA_S):
    return WebDriverWait(driver, segundos).until(condicao)


def visivel(driver, xpath, segundos=ESPERA_S):
    return esperar(driver, EC.visibility_of_element_located((By.XPATH, xpath)), segundos)


def clicavel(driver, xpath, segundos=ESPERA_S):
    return esperar(driver, EC.element_to_be_clickable((By.XPATH, xpath)), segundos)


def clicar(driver, xpath, segundos=ESPERA_S):
    elemento = clicavel(driver, xpath, segundos)
    # O site usa rolagem suave: sem "instant", o clique sai antes de a página
    # parar de rolar e cai em outro elemento.
    driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'instant'});", elemento)
    elemento.click()
    pausa()
    return elemento


def sumir(driver, xpath, segundos=ESPERA_S):
    return esperar(driver, EC.invisibility_of_element_located((By.XPATH, xpath)), segundos)


def existe(driver, xpath, segundos=2):
    """Verdadeiro se o elemento aparecer em até `segundos` (curto, para
    afirmar ausência sem deixar o teste lento)."""
    try:
        visivel(driver, xpath, segundos)
        return True
    except TimeoutException:
        return False


def texto(valor):
    """XPath que casa um nó cujo texto normalizado é exatamente `valor`."""
    return f"normalize-space()={xpath_literal(valor)}"


def contem(valor):
    return f"contains(normalize-space(), {xpath_literal(valor)})"


def xpath_literal(valor):
    if "'" not in valor:
        return f"'{valor}'"
    if '"' not in valor:
        return f'"{valor}"'
    partes = valor.split("'")
    return "concat(" + ", \"'\", ".join(f"'{p}'" for p in partes) + ")"


# --------------------------------------------------------------------- tela


def abrir(driver, caminho):
    driver.get(f"{FRONT_URL}{caminho}")


def entrar(driver, perfil="super"):
    """Faz login pela tela, como a administradora faria."""
    abrir(driver, "/login")
    visivel(driver, "//input[@name='usuario']").send_keys(PERFIS[perfil])
    driver.find_element(By.NAME, "senha").send_keys(SENHA)
    clicar(driver, "//button[normalize-space()='Login']")
    esperar(driver, EC.url_contains("/admin"))


def pausa():
    if PAUSA_S:
        time.sleep(PAUSA_S)


def preencher(elemento, valor):
    elemento.clear()
    elemento.send_keys(valor)
    pausa()


def preencher_data(driver, nome, valor):
    """Campos type=date/time: o send_keys depende do idioma do Chrome, então o
    valor é escrito pelo setter nativo e o React é avisado do evento."""
    campo = driver.find_element(By.NAME, nome)
    driver.execute_script(
        """
        const [campo, valor] = arguments;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(campo, valor);
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
        """,
        campo,
        valor,
    )


# ---------------------------------------------------------------------- API


class ClienteApi:
    """Prepara dados pela API real e guarda o que criou para apagar depois."""

    def __init__(self, perfil="super"):
        self.sessao = requests.Session()
        self.sessao.headers["Authorization"] = f"Bearer {token(perfil)}"
        self._criados = []

    def _url(self, caminho):
        return f"{API_URL}{caminho}"

    def get(self, caminho):
        return self.sessao.get(self._url(caminho), timeout=20)

    def post(self, caminho, corpo=None):
        return self.sessao.post(self._url(caminho), json=corpo, timeout=20)

    def put(self, caminho, corpo=None):
        return self.sessao.put(self._url(caminho), json=corpo, timeout=20)

    def delete(self, caminho):
        return self.sessao.delete(self._url(caminho), timeout=20)

    def _criar(self, caminho, corpo, chave_id, rota_exclusao):
        resposta = self.post(caminho, corpo)
        assert resposta.status_code == 201, f"POST {caminho}: {resposta.status_code} {resposta.text}"
        dados = resposta.json()
        self._criados.append(rota_exclusao.format(id=dados[chave_id]))
        return dados

    def criar_evento(self, nome, inicio, fim=None, **campos):
        fim = fim or inicio + timedelta(hours=2)
        corpo = {
            "nome": nome,
            "tipo_evento": "Conferência",
            "descricao": f"Evento criado pelos testes funcionais ({nome}).",
            "data_inicio": iso(inicio),
            "data_fim": iso(fim),
            "local_latitude": -15.7939,
            "local_longitude": -47.8828,
            **campos,
        }
        if corpo.get("modalidade") == "online":
            corpo["local_latitude"] = corpo["local_longitude"] = None
        return self._criar("/evento/", corpo, "evento_id", "/evento/{id}")

    def criar_atividade(self, evento_id, nome, inicio):
        corpo = {"nome": nome, "horario_inicio": iso(inicio), "horario_termino": iso(inicio + timedelta(hours=1))}
        resposta = self.post(f"/evento/{evento_id}/atividade", corpo)
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    def criar_convidado(self, nome, profissao="Banda"):
        return self._criar(
            "/banda-palestrante/", {"nome": nome, "profissao": profissao},
            "participante_id", "/banda-palestrante/{id}",
        )

    def vincular_convidado(self, evento_id, participante_id):
        resposta = self.post(f"/evento/{evento_id}/participantes/{participante_id}")
        assert resposta.status_code == 201, resposta.text

    def criar_lider(self, nome, cargo, **campos):
        return self._criar("/lider/", {"nome": nome, "cargo": cargo, **campos}, "lider_id", "/lider/{id}")

    def evento(self, evento_id):
        return self.get(f"/evento/{evento_id}")

    def registrar(self, rota):
        """Para o que o teste criou pela tela: também é apagado no final."""
        self._criados.append(rota)

    def esquecer(self, rota):
        """Para o que o próprio teste já apagou pela tela."""
        if rota in self._criados:
            self._criados.remove(rota)

    def limpar(self):
        # Eventos primeiro: apagar um convidado ainda vinculado a um evento
        # derruba a requisição no back-end (defeito registrado em
        # test_bugs_encontrados.py).
        for rota in sorted(reversed(self._criados), key=lambda r: not r.startswith("/evento/")):
            self.delete(rota)
        self._criados.clear()


def token(perfil="super"):
    resposta = requests.post(
        f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": CLIENT_ID,
            "username": PERFIS[perfil],
            "password": SENHA,
        },
        timeout=20,
    )
    assert resposta.status_code == 200, (
        "Login no Keycloak falhou. O ambiente foi preparado? "
        f"(python3 ambiente/preparar_keycloak.py) — {resposta.status_code} {resposta.text}"
    )
    return resposta.json()["access_token"]
