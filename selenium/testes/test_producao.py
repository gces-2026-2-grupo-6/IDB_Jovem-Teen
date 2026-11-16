"""Verificação do que está publicado, depois do deploy.

Nenhum teste do projeto olhava para a produção. A consequência já aconteceu:
o Keycloak ficou fora do ar de 17/10 a 10/11 — vinte e quatro dias — sem que
ninguém percebesse, porque o site público continuou funcionando e o único
sintoma era o login falhar. As suítes estavam verdes e estavam certas: elas
não falam com a produção.

Dois destes testes não usam navegador. O Keycloak e o CORS da API são
verificados por HTTP direto porque o navegador esconde justamente o detalhe
que importa — resposta bloqueada por CORS chega na tela como lista vazia,
não como erro.

Rodar depois de cada deploy:

    ALVO=producao \\
    FRONT_URL=https://idbjovemeteen.tech \\
    API_URL=https://api.idbjovemeteen.tech \\
    KEYCLOAK_URL=https://auth.idbjovemeteen.tech \\
    pytest testes/test_producao.py -v
"""

import html
import json
import os
import re

import pytest
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from apoio import API_URL, FRONT_URL, KEYCLOAK_URL, REALM, abrir

pytestmark = [pytest.mark.fora_do_ambiente, pytest.mark.producao]

TEMPO_LIMITE = 30


@pytest.fixture(autouse=True)
def so_contra_producao():
    """Pular é melhor que falhar.

    Contra o ambiente local estes testes falhariam por ausência de dado, e
    falha que todo mundo sabe que vai acontecer é falha que todo mundo
    aprende a ignorar.
    """
    if os.environ.get("ALVO", "local").lower() != "producao":
        pytest.skip("exige a produção publicada; rode com ALVO=producao")


def test_keycloak_do_realm_responde():
    """O incidente de 17/10 a 10/11, virado teste.

    O endpoint de descoberta é o menor sinal que prova que o Keycloak subiu,
    achou o banco e carregou o realm. Qualquer um dos três faltando derruba o
    login — e foi isso que ninguém viu por vinte e quatro dias.
    """
    resposta = requests.get(
        f"{KEYCLOAK_URL}/realms/{REALM}/.well-known/openid-configuration",
        timeout=TEMPO_LIMITE,
    )
    assert resposta.status_code == 200, (
        f"Keycloak respondeu {resposta.status_code} — login fora do ar"
    )
    descoberta = resposta.json()
    assert descoberta["issuer"].endswith(f"/realms/{REALM}")
    assert "token_endpoint" in descoberta


def test_api_responde_nas_rotas_publicas():
    for rota in ("/evento/", "/material/", "/lider/"):
        resposta = requests.get(f"{API_URL}{rota}", timeout=TEMPO_LIMITE)
        assert resposta.status_code == 200, f"{rota} respondeu {resposta.status_code}"


def test_links_do_painel_nao_sao_publicos():
    """Os links fixados do painel (US10) sao so da superadministradora.

    Sem token a rota tem que recusar. Um 200 aqui significaria a guarda de
    papel desligada em producao; um 404 ou 500, a rota ou a tabela faltando —
    deploy sem a migracao da Sprint 3.
    """
    resposta = requests.get(f"{API_URL}/painel/links", timeout=TEMPO_LIMITE)
    assert resposta.status_code in (401, 403), (
        f"/painel/links respondeu {resposta.status_code} sem token"
    )


def test_api_libera_o_dominio_do_site_no_cors():
    """CORS errado não aparece como erro na tela: aparece como lista vazia.

    Por isso a verificação é por HTTP, com o cabeçalho Origin na mão. Se a
    API parar de liberar o domínio do site, a página de eventos fica vazia e
    parece que não há evento cadastrado.
    """
    resposta = requests.get(
        f"{API_URL}/evento/", headers={"Origin": FRONT_URL}, timeout=TEMPO_LIMITE
    )
    assert resposta.status_code == 200
    liberado = resposta.headers.get("Access-Control-Allow-Origin")
    assert liberado in (FRONT_URL, "*"), (
        f"a API não libera {FRONT_URL} no CORS (recebido: {liberado!r})"
    )


def test_migracoes_da_sprint3_chegaram_ao_banco():
    """As colunas novas têm que existir no banco de produção, não só no código.

    Deploy com `git pull` e `build` mas sem `alembic upgrade head` deixa o
    código novo falando com o banco velho. O sintoma é 500 na primeira
    consulta que toca a coluna nova — nunca um erro de build.

    Cada campo abaixo nasceu numa migração da Sprint 3.
    """
    resposta = requests.get(f"{API_URL}/openapi.json", timeout=TEMPO_LIMITE)
    assert resposta.status_code == 200
    contrato = json.dumps(resposta.json())
    for campo in ("modalidade", "situacao", "url_download"):
        assert campo in contrato, f"campo {campo!r} ausente do contrato publicado"


def test_eventos_chegam_da_api_ate_a_tela(navegador):
    """Front, API e banco conversando, sem nada simulado no meio.

    O teste só é válido se houver evento cadastrado — por isso pergunta à API
    antes e se declara inconclusivo quando não há dado, em vez de passar por
    engano com a tela vazia.
    """
    resposta = requests.get(f"{API_URL}/evento/", timeout=TEMPO_LIMITE)
    assert resposta.status_code == 200
    dados = resposta.json()
    eventos = dados if isinstance(dados, list) else dados.get("items", [])
    if not eventos:
        pytest.skip("nenhum evento cadastrado em produção; nada a conferir na tela")

    abrir(navegador, "/eventos")
    WebDriverWait(navegador, 30).until(
        lambda d: "Carregando" not in d.find_element(By.TAG_NAME, "body").text
    )
    tela = navegador.find_element(By.TAG_NAME, "body").text

    nomes = [e.get("nome") or e.get("titulo") or "" for e in eventos]
    nomes = [nome for nome in nomes if nome]
    assert nomes, f"a API devolveu evento sem nome reconhecível: {eventos[:1]}"
    assert any(nome[:20] in tela for nome in nomes), (
        "a API tem eventos, mas nenhum apareceu na tela"
    )


ROBO_DE_PREVIA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"


def _meta(html_da_pagina, propriedade):
    achado = re.search(
        rf'<meta property="{re.escape(propriedade)}" content="([^"]*)"', html_da_pagina
    )
    return html.unescape(achado.group(1)) if achado else None


def _um_evento_publicado():
    resposta = requests.get(f"{API_URL}/evento/", timeout=TEMPO_LIMITE)
    assert resposta.status_code == 200
    dados = resposta.json()
    eventos = dados if isinstance(dados, list) else dados.get("items", [])
    com_nome = [e for e in eventos if e.get("nome")]
    if not com_nome:
        pytest.skip("nenhum evento cadastrado em producao; nada a conferir no card")
    return com_nome[0]


def test_card_de_compartilhamento_traz_o_evento_e_nao_o_site():
    """US08 — o link de um evento colado no WhatsApp mostra o evento.

    O robo de previa nao executa JavaScript, entao o `vercel.json` manda as
    requisicoes dele em `/eventos/:slug` para uma funcao que devolve o HTML ja
    com as tags do evento. Nenhum teste do projeto exercita essa funcao
    publicada: os de `tests/utils/us08-open-graph.spec.js` cobrem a montagem
    do HTML, nao a rota nem o ambiente.

    E e no ambiente que ela quebra em silencio. A funcao le o endereco da API
    de uma variavel de ambiente do Vercel; se a variavel nao existir para
    funcoes, ou se a API demorar mais que o prazo, ela **nao falha**: devolve
    o card institucional, com 200. Quem compartilha ve o card generico e
    ninguem recebe erro nenhum. Por isso o teste nao se contenta com o 200 —
    ele exige o nome do evento no titulo.
    """
    evento = _um_evento_publicado()
    resposta = requests.get(
        f"{FRONT_URL}/eventos/{evento['evento_id']}-evento",
        headers={"User-Agent": ROBO_DE_PREVIA},
        timeout=TEMPO_LIMITE,
    )
    assert resposta.status_code == 200, f"a rota do card respondeu {resposta.status_code}"

    titulo = _meta(resposta.text, "og:title")
    assert titulo, "a resposta ao robo nao traz og:title — a regra do vercel.json nao casou"
    assert evento["nome"] in titulo, (
        f"o card nao traz o evento (og:title={titulo!r}): a funcao caiu no card "
        "institucional — confira a variavel de ambiente com o endereco da API no Vercel"
    )
    assert _meta(resposta.text, "og:type") == "article"
    assert _meta(resposta.text, "og:image"), "card sem imagem"


def test_visitante_comum_recebe_a_aplicacao_e_nao_o_card():
    """O inverso do anterior: a regra do robo nao pode pegar gente.

    Se a condicao de user-agent do `vercel.json` casar demais, o visitante
    recebe o HTML cru do card no lugar do site.
    """
    evento = _um_evento_publicado()
    resposta = requests.get(
        f"{FRONT_URL}/eventos/{evento['evento_id']}-evento",
        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/130.0"},
        timeout=TEMPO_LIMITE,
    )
    assert resposta.status_code == 200
    assert 'id="root"' in resposta.text, "o visitante comum nao recebeu a aplicacao"


def test_login_real_de_ponta_a_ponta(navegador):
    """O caminho completo: formulário, Keycloak, token, painel.

    Exige um usuário de teste em produção. Sem as credenciais no ambiente o
    teste se declara inconclusivo — nunca falso-verde.
    """
    usuario = os.environ.get("USUARIO_TESTE")
    senha = os.environ.get("SENHA_TESTE")
    if not (usuario and senha):
        pytest.skip("defina USUARIO_TESTE e SENHA_TESTE para exercitar o login real")

    abrir(navegador, "/login")
    navegador.find_element(By.CSS_SELECTOR, 'input[name="usuario"]').send_keys(usuario)
    navegador.find_element(By.CSS_SELECTOR, 'input[name="senha"]').send_keys(senha)
    navegador.find_element(By.CSS_SELECTOR, 'form button[type="submit"]').click()

    WebDriverWait(navegador, 30).until(
        lambda d: "/admin" in d.current_url
        or "not fully set up" in d.find_element(By.TAG_NAME, "body").text.lower()
    )
    corpo = navegador.find_element(By.TAG_NAME, "body").text.lower()
    assert "not fully set up" not in corpo, (
        "usuário com ação pendente no Keycloak — limpe 'Required user actions' "
        "e redefina a senha com Temporary: Off"
    )
    assert "/admin" in navegador.current_url, "o login não levou ao painel"
