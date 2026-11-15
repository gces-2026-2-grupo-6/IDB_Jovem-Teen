"""Defeitos encontrados pelos testes funcionais, fora das histórias do trio.

Cada teste descreve o comportamento esperado e falha hoje (xfail estrito).
Quando o defeito for corrigido, o pytest acusa XPASS e o marcador sai.
"""

import pytest

from apoio import abrir, clicar, dias_a_partir_de_hoje, entrar, existe, marca, sumir, texto, visivel


@pytest.mark.xfail(strict=True, reason=(
    "Bug (US06, registrado pela QA na Sprint 2): excluir convidado vinculado a um evento "
    "estoura IntegrityError no back-end; a requisição cai sem resposta e a tela mostra erro de rede."
))
def test_excluir_convidado_vinculado_nao_quebra_a_tela(navegador, api):
    tag = marca()
    evento = api.criar_evento(f"{tag} Evento", dias_a_partir_de_hoje(50))
    convidado = api.criar_convidado(f"{tag} Banda vinculada")
    api.vincular_convidado(evento["evento_id"], convidado["participante_id"])

    entrar(navegador)
    abrir(navegador, "/admin/palestrantes")
    linha = f"//*[.//p[{texto(convidado['nome'])}]][.//button[@title='Excluir']]"
    clicar(navegador, f"({linha})[last()]//button[@title='Excluir']")
    clicar(navegador, "//button[normalize-space()='Sim']")

    # Esperado: ou o convidado sai (com os vínculos), ou uma mensagem clara
    # diz que ele está vinculado a um evento. Nunca "Network Error".
    removido = not existe(navegador, f"//p[{texto(convidado['nome'])}]", 3)
    mensagem_clara = existe(navegador, "//*[contains(normalize-space(), 'vinculado')]", 1)
    assert removido or mensagem_clara
    assert not existe(navegador, "//*[contains(normalize-space(), 'Network Error')]", 1)
