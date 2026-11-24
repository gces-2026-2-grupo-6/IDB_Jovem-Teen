"""Regressões identificadas pelos testes funcionais, fora das histórias do trio."""

from apoio import abrir, clicar, dias_a_partir_de_hoje, entrar, existe, marca, texto


def test_excluir_convidado_vinculado_nao_quebra_a_tela(navegador, api):
    """Regressao da US06: excluir convidado vinculado avisa em vez de quebrar.

    A API responde 409 para manter o convidado vinculado; a tela deve mostrar
    a mensagem clara e continuar funcionando, sem "Network Error".
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
