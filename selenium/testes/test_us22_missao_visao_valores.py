"""US22 — Missão, visão e valores.

O front está pronto; o back-end ainda não tem GET/PUT /institucional. O teste
de ponta a ponta fica registrado como falha esperada (xfail estrito): quando a
rota entrar, ele passa e o pytest acusa, para o marcador ser removido.
"""

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from apoio import (
    FRONT_URL, MISSAO_PUBLICADA, abrir, clicar, contem, entrar, esperar,
    existe, marca, preencher, texto, visivel,
)

pytestmark = pytest.mark.us22

BLOCO = "//section[.//h2[{}]]"


def test_saiba_mais_da_pagina_inicial_leva_a_quem_somos(navegador):
    abrir(navegador, "/")
    secao = "//section[.//h2[contains(normalize-space(), 'CONHEÇA O IDB')]]"
    clicar(navegador, f"{secao}//a[{texto('Saiba mais')}]")
    esperar(navegador, EC.url_to_be(f"{FRONT_URL}/quem-somos"))


def test_quem_somos_mostra_a_missao_ja_publicada_sem_inventar_texto(navegador):
    abrir(navegador, "/quem-somos")
    missao = visivel(navegador, BLOCO.format(texto("Missão")))
    assert MISSAO_PUBLICADA in missao.text
    assert not existe(navegador, BLOCO.format(texto("Visão")), 1)
    assert not existe(navegador, BLOCO.format(texto("Valores")), 1)


def test_rodape_leva_a_quem_somos(navegador):
    abrir(navegador, "/eventos")
    clicar(navegador, f"//footer//a[{texto('Missão, visão e valores')}]")
    esperar(navegador, EC.url_to_be(f"{FRONT_URL}/quem-somos"))


def test_tela_do_painel_so_aparece_para_a_superadmin(navegador):
    entrar(navegador, "eventos")
    abrir(navegador, "/admin")
    visivel(navegador, f"//nav//a[{texto('Eventos')}]")
    assert not existe(navegador, f"//nav//a[{texto('Missão e valores')}]", 1)
    abrir(navegador, "/admin/institucional")
    esperar(navegador, EC.url_contains("/unauthorized"))


def test_salvar_sem_rota_no_servidor_avisa_em_vez_de_quebrar(navegador):
    entrar(navegador)
    abrir(navegador, "/admin/institucional")
    visivel(navegador, f"//*[{contem('Ainda não há conteúdo salvo.')}]")
    clicar(navegador, "//button[normalize-space()='Salvar']")
    aviso = visivel(navegador, "//*[@role='alert']")
    assert aviso.text == "O servidor ainda não oferece o cadastro deste conteúdo."


@pytest.mark.xfail(strict=True, reason="Back-end ainda não implementa GET/PUT /institucional (US22).")
def test_conteudo_salvo_no_painel_aparece_na_pagina_publica(navegador):
    visao = f"{marca()} Ser referência para a juventude."
    entrar(navegador)
    abrir(navegador, "/admin/institucional")
    preencher(visivel(navegador, "//textarea[@id='visao']"), visao)
    clicar(navegador, "//button[normalize-space()='Salvar']")
    visivel(navegador, "//*[@role='status']", 5)

    abrir(navegador, "/quem-somos")
    assert visao in visivel(navegador, BLOCO.format(texto("Visão")), 5).text
    assert navegador.find_elements(By.XPATH, BLOCO.format(texto("Visão")))
