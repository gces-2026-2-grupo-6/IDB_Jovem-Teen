"""Prepara o Keycloak do ambiente de testes funcionais.

1. Libera o front local (http://localhost:5173) nas origens do client
   `jovem-backend`: o realm.json só libera localhost:8000, e o login do front
   seria bloqueado por CORS.
2. Cria os usuários de teste, um por perfil, com senha fixa.

Só fala com o Keycloak local do docker-compose desta pasta. Usa apenas a
biblioteca padrão, para rodar antes de instalar qualquer dependência.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

KEYCLOAK = os.environ.get("KEYCLOAK_URL", "http://localhost:8080").rstrip("/")
REALM = "jovem"
CLIENT_ID = "jovem-backend"
ORIGEM_FRONT = "http://localhost:5173"
SENHA = "selenium123"

USUARIOS = {
    "selenium-super": ["admin", "superadmin"],
    "selenium-eventos": ["admin", "admin-eventos"],
    "selenium-produtos": ["admin", "admin-produtos"],
    "selenium-inscricoes": ["admin", "admin-inscricoes"],
}


def requisitar(metodo, url, token=None, corpo=None, form=None):
    dados = None
    cabecalhos = {}
    if form is not None:
        dados = urllib.parse.urlencode(form).encode()
        cabecalhos["Content-Type"] = "application/x-www-form-urlencoded"
    elif corpo is not None:
        dados = json.dumps(corpo).encode()
        cabecalhos["Content-Type"] = "application/json"
    if token:
        cabecalhos["Authorization"] = f"Bearer {token}"
    pedido = urllib.request.Request(url, data=dados, headers=cabecalhos, method=metodo)
    with urllib.request.urlopen(pedido, timeout=15) as resposta:
        texto = resposta.read().decode()
        return json.loads(texto) if texto else None


def esperar_keycloak(limite_s=180):
    inicio = time.time()
    while time.time() - inicio < limite_s:
        try:
            requisitar("GET", f"{KEYCLOAK}/realms/{REALM}/.well-known/openid-configuration")
            return
        except (urllib.error.URLError, ConnectionError, TimeoutError):
            time.sleep(3)
    sys.exit("O Keycloak não respondeu a tempo.")


def token_admin():
    resposta = requisitar(
        "POST",
        f"{KEYCLOAK}/realms/master/protocol/openid-connect/token",
        form={"grant_type": "password", "client_id": "admin-cli", "username": "admin", "password": "admin"},
    )
    return resposta["access_token"]


def liberar_origem_do_front(token):
    base = f"{KEYCLOAK}/admin/realms/{REALM}/clients"
    client = requisitar("GET", f"{base}?clientId={CLIENT_ID}", token)[0]
    origens = set(client.get("webOrigins") or [])
    if ORIGEM_FRONT not in origens:
        client["webOrigins"] = sorted(origens | {ORIGEM_FRONT})
        requisitar("PUT", f"{base}/{client['id']}", token, corpo=client)


def criar_usuario(token, nome, papeis):
    base = f"{KEYCLOAK}/admin/realms/{REALM}"
    existentes = requisitar("GET", f"{base}/users?username={nome}&exact=true", token)
    if not existentes:
        requisitar(
            "POST",
            f"{base}/users",
            token,
            corpo={
                "username": nome,
                "email": f"{nome}@example.com",
                "firstName": "Selenium",
                "lastName": nome.split("-", 1)[1].capitalize(),
                "enabled": True,
                "emailVerified": True,
                "credentials": [{"type": "password", "value": SENHA, "temporary": False}],
            },
        )
        existentes = requisitar("GET", f"{base}/users?username={nome}&exact=true", token)
    usuario_id = existentes[0]["id"]
    papeis_realm = [requisitar("GET", f"{base}/roles/{papel}", token) for papel in papeis]
    requisitar("POST", f"{base}/users/{usuario_id}/role-mappings/realm", token, corpo=papeis_realm)


def main():
    esperar_keycloak()
    token = token_admin()
    liberar_origem_do_front(token)
    for nome, papeis in USUARIOS.items():
        criar_usuario(token, nome, papeis)
    print(f"Keycloak pronto: {len(USUARIOS)} usuários de teste (senha {SENHA}).")


if __name__ == "__main__":
    main()
