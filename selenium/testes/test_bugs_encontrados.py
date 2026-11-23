"""Defeitos encontrados pelos testes funcionais, fora das histórias do trio.

Cada teste nasce descrevendo o comportamento esperado e falhando (xfail
estrito). Quando o defeito é corrigido, o pytest acusa XPASS, o marcador sai e
o teste fica como regressão — é o que aconteceu com o da US06.
"""

from apoio import abrir, clicar, dias_a_partir_de_hoje, entrar, existe, marca, sumir, texto, visivel


def test_excluir_convidado_vinculado_nao_quebra_a_tela(navegador, api):
    """Era xfail estrito até a PR #25 do back-end.

    O defeito (US06, registrado pela QA na Sprint 2): excluir convidado
    vinculado a um evento estourava IntegrityError, a requisição caía sem
    resposta e a tela mostrava "Network Error". A PR #25 passou a responder
    409 com mensagem, então o teste começou a passar — e `strict=True`
    transforma XPASS em falha, derrubando o CI.

    Sem o marcador, ele vira o que deveria ser agora: a regressão que impede
    o defeito de voltar.
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
