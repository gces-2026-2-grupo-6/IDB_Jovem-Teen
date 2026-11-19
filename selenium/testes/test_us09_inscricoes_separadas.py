"""US09 — Inscrição separada para voluntários e participantes.

RF52. Antes, um evento tinha uma listagem só; a US09 a quebrou em dois fluxos
independentes — voluntários (que passam por aprovação) e participantes (que
não) —, cada um com a sua aba e a sua tabela.

As listas em si vêm do formulário do Google e exigem as credenciais que o
ambiente local não tem. O que não depende do Google — e é o coração da
história — é a *separação*: duas abas distintas, uma ativa de cada vez. É isso
que este teste exercita, sem inventar inscrição que não existe.
"""

import pytest
from selenium.webdriver.common.by import By

from apoio import abrir, entrar, esperar, marca, texto, visivel

pytestmark = pytest.mark.us09

ABA = "//button[@role='tab'][{}]"


def test_evento_tem_dois_fluxos_de_inscricao_separados(navegador, api):
    """O evento mostra abas separadas de Voluntários e Participantes.

    A troca de aba muda qual fluxo está ativo (`aria-selected`), provando que
    são duas listas independentes, e não um filtro sobre a mesma.
    """
    from apoio import dias_a_partir_de_hoje

    tag = marca()
    evento = api.criar_evento(f"{tag} Encontro com inscrições", dias_a_partir_de_hoje(15))

    entrar(navegador)
    abrir(navegador, f"/admin/voluntarios/{evento['evento_id']}")

    # O título confirma que é a tela de inscrições deste evento.
    visivel(navegador, f"//*[{texto(evento['nome'])}]")

    voluntarios = ABA.format(texto("Voluntários"))
    participantes = ABA.format(texto("Participantes"))
    visivel(navegador, voluntarios)
    visivel(navegador, participantes)

    # Voluntários é a aba inicial — por onde se chega ao fluxo.
    assert (
        navegador.find_element(By.XPATH, voluntarios).get_attribute("aria-selected")
        == "true"
    ), "a aba inicial deveria ser a de Voluntários"

    # Trocar para Participantes ativa o outro fluxo e desativa o primeiro.
    navegador.find_element(By.XPATH, participantes).click()
    esperar(
        navegador,
        lambda d: d.find_element(By.XPATH, participantes).get_attribute("aria-selected")
        == "true",
    )
    assert (
        navegador.find_element(By.XPATH, voluntarios).get_attribute("aria-selected")
        == "false"
    ), "as duas abas ficaram ativas ao mesmo tempo — os fluxos não estão separados"
