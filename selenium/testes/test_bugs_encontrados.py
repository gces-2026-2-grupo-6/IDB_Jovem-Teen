"""Defeitos encontrados pelos testes funcionais, fora das histórias do trio.

Cada teste nasce descrevendo o comportamento esperado e falhando (xfail
estrito). Quando o defeito é corrigido, o pytest acusa XPASS, o marcador sai e
o teste fica como regressão — é o que aconteceu com o da US06.
"""

import pytest

from apoio import abrir, clicar, dias_a_partir_de_hoje, entrar, existe, marca, texto


@pytest.mark.xfail(strict=True, reason=(
    "US06: o seletor procurava o nome do convidado em <p>, mas a RF51 trocou "
    "para <Link> (<a>) em /admin/palestrantes. Validar execucao ponta a ponta "
    "contra o back-end da PR #25 antes de remover o marcador."
))
def test_excluir_convidado_vinculado_nao_quebra_a_tela(navegador, api):
    """Regressao da US06: excluir convidado vinculado avisa em vez de quebrar.

    Historico: nasceu xfail estrito porque excluir convidado vinculado
    estourava IntegrityError no back-end e a tela mostrava "Network Error".
    A PR #25 corrigiu o back-end para responder 409 com mensagem clara.

    Na RF51 o nome do convidado na listagem virou link (<a>) para o historico
    de participacoes, deixando o seletor antigo (//p[...]) desatualizado.
    """
    tag = marca()
    evento = api.criar_evento(f"{tag} Evento", dias_a_partir_de_hoje(50))
    convidado = api.criar_convidado(f"{tag} Banda vinculada")
    api.vincular_convidado(evento["evento_id"], convidado["participante_id"])

    entrar(navegador)
    abrir(navegador, "/admin/palestrantes")
    linha = f"//div[.//a[{texto(convidado['nome'])}]][.//button[@title='Excluir']]"
    clicar(navegador, f"({linha})[last()]//button[@title='Excluir']")
    clicar(navegador, "//button[normalize-space()='Sim']")

    # Esperado: ou o convidado sai (com os vínculos), ou uma mensagem clara
    # diz que ele está vinculado a um evento. Nunca "Network Error".
    removido = not existe(navegador, f"//a[{texto(convidado['nome'])}]", 3)
    mensagem_clara = existe(navegador, "//*[contains(normalize-space(), 'vinculado')]", 1)
    assert removido or mensagem_clara
    assert not existe(navegador, "//*[contains(normalize-space(), 'Network Error')]", 1)
