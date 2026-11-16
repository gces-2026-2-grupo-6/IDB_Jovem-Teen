"""US05 — CRUD de líderes e diretores anteriores pelo painel."""

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from apoio import (
    abrir, clicar, entrar, esperar, marca, preencher, sumir, texto, visivel,
)

pytestmark = pytest.mark.us05

CARD = "//article[.//h3[{}]]"


def nome_no_card(nome):
    return CARD.format(texto(nome))


def test_cadastrar_editar_e_excluir_lider(navegador, api):
    tag = marca()
    nome, novo_nome = f"{tag} Ana Souza", f"{tag} Ana Souza Lima"
    entrar(navegador)
    abrir(navegador, "/admin/lideres/criar")

    preencher(visivel(navegador, "//input[@name='name']"), nome)
    preencher(navegador.find_element(By.NAME, "role"), f"Diretora Regional {tag}")
    Select(navegador.find_element(By.NAME, "region")).select_by_index(2)
    clicar(navegador, "//button[@type='submit']")
    visivel(navegador, f"//*[{texto('Diretor/líder cadastrado com sucesso.')}]")
    visivel(navegador, nome_no_card(nome))
    lider = next(l for l in api.get("/lider/").json() if l["nome"] == nome)
    api.registrar(f"/lider/{lider['lider_id']}")

    clicar(navegador, f"{nome_no_card(nome)}//button[{texto('Editar')}]")
    preencher(visivel(navegador, "//input[@name='name']"), novo_nome)
    clicar(navegador, "//button[@type='submit']")
    visivel(navegador, f"//*[{texto('Diretor/líder atualizado com sucesso.')}]")
    visivel(navegador, nome_no_card(novo_nome))
    assert api.get(f"/lider/{lider['lider_id']}").json()["nome"] == novo_nome

    clicar(navegador, f"{nome_no_card(novo_nome)}//button[{texto('Excluir')}]")
    visivel(navegador, f"//h3[{texto('Excluir diretor/líder?')}]")
    # O botão do modal, e não o "Excluir" do card que fica atrás dele.
    clicar(navegador, "//h3[normalize-space()='Excluir diretor/líder?']/ancestor::div[.//button][1]//button[normalize-space()='Excluir']")
    sumir(navegador, nome_no_card(novo_nome))
    assert api.get(f"/lider/{lider['lider_id']}").status_code == 404
    api.esquecer(f"/lider/{lider['lider_id']}")


def test_tela_de_lideres_e_so_da_superadmin(navegador):
    entrar(navegador, "eventos")
    abrir(navegador, "/admin/lideres")
    esperar(navegador, EC.url_contains("/unauthorized"))


def test_galeria_de_anteriores_mostra_so_cargo_nacional(navegador, api):
    tag = marca()
    nacional = api.criar_lider(f"{tag} Diretor nacional antigo", f"Diretor Nacional {tag}",
                               regiao="Nacional", is_antigo=True, gestao="2018 – 2021")
    regional = api.criar_lider(f"{tag} Diretor regional antigo", f"Diretor Regional {tag}",
                               regiao="Região Sul", is_antigo=True)
    abrir(navegador, "/")
    clicar(navegador, f"//button[{texto('Galeria de Diretores')}]")

    visivel(navegador, f"//h4[{texto(nacional['nome'])}]")
    assert not navegador.find_elements(By.XPATH, f"//h4[{texto(regional['nome'])}]")
