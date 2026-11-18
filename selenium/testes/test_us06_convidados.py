"""US06 — CRUD de bandas e palestrantes reaproveitáveis entre eventos.

RF47 a RF50. A história tem duas marcas próprias na tela de Convidados, e são
elas que estes testes exercitam:

* a busca por função, que encontra o convidado pelo que ele faz, não só pelo
  nome;
* o reaproveitamento, que mostra em quantos eventos o mesmo convidado já está
  — o ponto da história é cadastrar uma vez e reusar.

Os dados entram pela API real (convidados e vínculos) e a tela é só verificada,
nunca usada para preparar. A limpeza é do fixture `api`.
"""

import pytest

from apoio import abrir, entrar, marca, preencher, sumir, texto, visivel

pytestmark = pytest.mark.us06

BUSCA = "//input[@aria-label='Buscar convidado']"


def linha_do_convidado(nome):
    """A linha da lista cujo nome (um link) é exatamente `nome`."""
    return f"//a[{texto(nome)}]"


def test_busca_encontra_convidado_pela_funcao(navegador, api):
    """A busca filtra por função, não só por nome.

    Dois convidados com funções diferentes; buscar a função de um traz só ele.
    É o que RF47–50 pedem para quem monta o evento e lembra do papel ("a banda
    do louvor"), não do nome.
    """
    tag = marca()
    banda = api.criar_convidado(f"{tag} Ministério de Louvor", profissao=f"Banda {tag}")
    orador = api.criar_convidado(f"{tag} Pedro Antunes", profissao=f"Palestrante {tag}")

    entrar(navegador)
    abrir(navegador, "/admin/palestrantes")
    visivel(navegador, linha_do_convidado(banda["nome"]))

    preencher(visivel(navegador, BUSCA), f"Palestrante {tag}")

    # A busca é por função: some quem é de outra, fica quem é da buscada.
    sumir(navegador, linha_do_convidado(banda["nome"]))
    visivel(navegador, linha_do_convidado(orador["nome"]))


def test_mesmo_convidado_reaproveitado_em_dois_eventos(navegador, api):
    """O reaproveitamento aparece na tela: "Em 2 eventos".

    Um convidado vinculado a dois eventos é um só cadastro usado duas vezes —
    é essa reutilização que a US06 entrega, e a tela a torna visível.
    """
    from apoio import dias_a_partir_de_hoje

    tag = marca()
    convidado = api.criar_convidado(f"{tag} Marina Rocha", profissao=f"Palestrante {tag}")

    evento_a = api.criar_evento(f"{tag} Conferência A", dias_a_partir_de_hoje(10))
    evento_b = api.criar_evento(f"{tag} Conferência B", dias_a_partir_de_hoje(20))
    api.vincular_convidado(evento_a["evento_id"], convidado["participante_id"])
    api.vincular_convidado(evento_b["evento_id"], convidado["participante_id"])

    entrar(navegador)
    abrir(navegador, "/admin/palestrantes")
    preencher(visivel(navegador, BUSCA), convidado["nome"])

    # A linha do convidado traz a contagem de eventos em que ele está.
    linha = (
        f"//div[.//a[{texto(convidado['nome'])}]]"
        f"[.//*[{texto('Em 2 eventos')}]]"
    )
    visivel(navegador, linha)
