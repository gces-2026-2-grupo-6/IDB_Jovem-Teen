"""US15 — Histórico de eventos passados com fotos.

RF13. No fim da página pública de eventos, depois da agenda, vem o que já
aconteceu: a seção "Já aconteceram", com um card por evento anterior que leva
à página do evento (onde o álbum da US07 é exibido).

As fotos vêm do Google e o selo só aparece quando existem; o ambiente local
não as tem. Mas a seção lista qualquer evento já passado, com foto ou sem — e
é essa listagem do histórico que o teste verifica, criando um evento no passado
pela API e conferindo que ele aparece lá, separado da agenda do que está por
vir.
"""

import pytest
from selenium.webdriver.common.by import By

from apoio import abrir, no_mes_anterior, marca, texto, visivel

pytestmark = pytest.mark.us15

HISTORICO = "//section[@id='historico']"


def test_evento_passado_aparece_no_historico(navegador, api):
    """Um evento já ocorrido entra na seção "Já aconteceram".

    A agenda acima mostra o que vem; o histórico, o que passou. Criar um evento
    no mês anterior e encontrá-lo aqui prova que o corte por data leva o evento
    ao lugar certo da página.
    """
    tag = marca()
    passado = api.criar_evento(f"{tag} Retiro de inverno", no_mes_anterior(dia=10))

    abrir(navegador, "/eventos")

    # A seção do histórico existe e traz o seu rótulo.
    visivel(navegador, f"{HISTORICO}//*[{texto('Já aconteceram')}]")

    # E o evento passado está dentro dela (um card que leva à página do evento).
    card = f"{HISTORICO}//*[{texto(passado['nome'])}]"
    visivel(navegador, card)
    assert navegador.find_elements(By.XPATH, f"{HISTORICO}//a[.//*[{texto(passado['nome'])}]]"), (
        "o card do evento passado não leva à página do evento"
    )
