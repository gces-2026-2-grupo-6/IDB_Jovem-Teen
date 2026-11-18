"""US04 — Página não traduzida automaticamente pelo navegador."""

import pytest
from selenium.webdriver.common.by import By

from apoio import abrir, marca, texto, visivel

pytestmark = pytest.mark.us04


def test_documento_declara_portugues_e_recusa_traducao(navegador):
    for caminho in ("/", "/eventos", "/galeria", "/quem-somos"):
        abrir(navegador, caminho)
        visivel(navegador, "//main")
        assert navegador.find_element(By.TAG_NAME, "html").get_attribute("lang") == "pt-BR", caminho
        meta = navegador.find_elements(By.XPATH, "//meta[@name='google'][@content='notranslate']")
        assert meta, caminho


def test_nome_do_lider_na_pagina_inicial_nao_e_traduzido(navegador, api):
    lider = api.criar_lider(f"{marca()} Pr. Áquila", f"Diretor Nacional {marca()}", regiao="Nacional")
    abrir(navegador, "/")
    nome = visivel(navegador, f"//h4[{texto(lider['nome'])}]")
    assert nome.get_dom_attribute("translate") == "no"
    # Sem tradução, o mesmo líder aparece uma vez só (era a foto duplicada).
    assert len(navegador.find_elements(By.XPATH, f"//h4[{texto(lider['nome'])}]")) == 1
