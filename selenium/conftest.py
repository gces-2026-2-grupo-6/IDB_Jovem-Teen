"""Fixtures dos testes funcionais com Selenium."""

import os
from pathlib import Path

import pytest
import requests
from selenium import webdriver

import apoio

PASTA_RELATORIO = Path(__file__).parent / "relatorio"


@pytest.fixture(scope="session", autouse=True)
def ambiente_no_ar(request):
    """Falha cedo, com orientação, se o sistema não estiver de pé.

    Os testes marcados com `fora_do_ambiente` não precisam da pilha local:
    eles olham para o que o servidor entrega (o build no CI) ou para a
    produção publicada. Quando a execução só tem desses, a verificação é
    dispensada — senão `pytest.exit` derrubaria a sessão inteira por falta de
    um ambiente que ninguém ia usar.
    """
    precisam = [
        item
        for item in request.session.items
        if "fora_do_ambiente" not in item.keywords
    ]
    if not precisam:
        return

    faltando = []
    for nome, url in [
        ("front", apoio.FRONT_URL),
        ("back-end", f"{apoio.API_URL}/evento/"),
        ("Keycloak", f"{apoio.KEYCLOAK_URL}/realms/{apoio.REALM}"),
    ]:
        try:
            requests.get(url, timeout=5).raise_for_status()
        except requests.RequestException:
            faltando.append(f"{nome} ({url})")
    if faltando:
        pytest.exit("Ambiente fora do ar: " + ", ".join(faltando) + ". Veja selenium/README.md.", returncode=2)


@pytest.fixture
def navegador():
    opcoes = webdriver.ChromeOptions()
    if os.environ.get("HEADLESS", "1") != "0":
        opcoes.add_argument("--headless=new")
    opcoes.add_argument("--window-size=1366,900")
    opcoes.add_argument("--lang=pt-BR")
    opcoes.add_argument("--disable-dev-shm-usage")
    opcoes.set_capability("goog:loggingPrefs", {"browser": "SEVERE"})
    driver = webdriver.Chrome(options=opcoes)
    if os.environ.get("DEMO") == "1":
        import time
        _get, _click = driver.get, None
        def devagar(url):
            _get(url); time.sleep(2)
        driver.get = devagar
        driver.implicitly_wait(1)
    yield driver
    driver.quit()


@pytest.fixture
def api():
    """Cliente da API real como superadministradora; apaga no final tudo o que
    o teste criou."""
    cliente = apoio.ClienteApi("super")
    yield cliente
    cliente.limpar()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Guarda um print da tela quando um teste falha."""
    resultado = yield
    relatorio = resultado.get_result()
    if relatorio.when == "call" and relatorio.failed and "navegador" in item.funcargs:
        PASTA_RELATORIO.mkdir(exist_ok=True)
        item.funcargs["navegador"].save_screenshot(str(PASTA_RELATORIO / f"{item.name}.png"))
