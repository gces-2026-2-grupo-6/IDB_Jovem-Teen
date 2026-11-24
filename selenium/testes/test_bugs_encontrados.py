"""Defeitos encontrados pelos testes funcionais, fora das histórias do trio.

Cada teste nasce descrevendo o comportamento esperado e falhando (xfail
estrito). Quando o defeito é corrigido, o pytest acusa XPASS, o marcador sai e
o teste fica como regressão — é o que aconteceu com o da US06.
"""

import pytest

from apoio import abrir, clicar, dias_a_partir_de_hoje, entrar, existe, marca, sumir, texto, visivel


@pytest.mark.xfail(strict=True, reason=(
    "US06: o teste falha hoje, mas NAO mais pelo defeito original. O back-end foi "
    "corrigido na PR #25 (merge 375b609) e agora responde 409 com mensagem em vez de "
    "estourar IntegrityError. O que falha agora e um passo anterior: o botao Excluir do "
    "convidado nao fica clicavel em /admin/palestrantes e o clique estoura TimeoutException. "
    "Causa ainda nao determinada - investigar com o ambiente completo no ar."
))
def test_excluir_convidado_vinculado_nao_quebra_a_tela(navegador, api):
    """Regressao da US06, hoje bloqueada por um problema de tela.

    Historico: nasceu xfail estrito porque excluir convidado vinculado
    estourava IntegrityError no back-end e a tela mostrava "Network Error".
    A PR #25 corrigiu o back-end.

    Em 23/11/2026 o marcador foi retirado por engano, na suposicao de que o
    teste passaria a XPASSar. Nao passa: ele agora falha antes do clique, sem
    encontrar o botao Excluir. O modo de falha mudou, o motivo registrado
    estava desatualizado, e o marcador voltou com a descricao certa.

    Quando o problema de tela for resolvido, o `strict=True` acusa XPASS e
    este marcador sai de vez.
    """
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
