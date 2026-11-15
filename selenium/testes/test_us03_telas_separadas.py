"""US03 (revisão, CA1) — produtos e eventos em telas separadas no painel."""

import pytest
from selenium.webdriver.support import expected_conditions as EC

from apoio import FRONT_URL, abrir, clicar, entrar, esperar, existe, texto, visivel

pytestmark = pytest.mark.us03

MENU = "//nav//a"


def test_painel_inicial_mostra_so_a_agenda(navegador):
    entrar(navegador)
    abrir(navegador, "/admin")

    visivel(navegador, f"//h2[{texto('Próximos Eventos')}]")
    visivel(navegador, f"//h2[{texto('Eventos Anteriores')}]")
    assert not existe(navegador, f"//h2[{texto('Produtos Cadastrados')}]", 2)


def test_produtos_tem_tela_e_item_de_menu_proprios(navegador):
    entrar(navegador)
    abrir(navegador, "/admin")

    clicar(navegador, f"{MENU}[{texto('Produtos')}]")
    esperar(navegador, EC.url_to_be(f"{FRONT_URL}/admin/produtos"))
    visivel(navegador, f"//h1[{texto('Produtos')}]")
    assert not existe(navegador, f"//h2[{texto('Próximos Eventos')}]", 1)


def test_admin_so_da_loja_entra_direto_em_produtos(navegador):
    entrar(navegador, "produtos")
    esperar(navegador, EC.url_to_be(f"{FRONT_URL}/admin/produtos"))
    visivel(navegador, f"//h1[{texto('Produtos')}]")


def test_admin_so_da_loja_nao_abre_a_agenda(navegador):
    entrar(navegador, "produtos")
    abrir(navegador, "/admin/eventos")
    esperar(navegador, EC.url_contains("/unauthorized"))
