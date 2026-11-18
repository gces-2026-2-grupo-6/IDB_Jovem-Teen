"""US23 — Calendário da página inicial com os eventos já ocorridos."""

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from apoio import (
    FRONT_URL, abrir, clicar, dias_a_partir_de_hoje, esperar, existe, marca,
    no_mes_anterior, texto, visivel,
)

pytestmark = pytest.mark.us23

SECAO = "//section[.//h2[contains(normalize-space(), 'Calendário de Eventos')]]"


def card(nome):
    return f"{SECAO}//div[contains(@class,'group')][.//h4[{texto(nome)}]]"


def ir_ao_mes_anterior(driver):
    abrir(driver, "/")
    visivel(driver, SECAO)
    clicar(driver, f"{SECAO}//button[@aria-label='Mês anterior']")


def test_evento_do_mes_passado_aparece_com_ja_aconteceu(navegador, api):
    evento = api.criar_evento(f"{marca()} Noite de louvor", no_mes_anterior(12))
    ir_ao_mes_anterior(navegador)

    elemento = visivel(navegador, card(evento["nome"]))
    assert elemento.get_attribute("data-passado") == "sim"
    assert "Já aconteceu" in elemento.text
    assert elemento.find_element(By.XPATH, ".//a").text == "Detalhes"


def test_evento_passado_com_album_oferece_ver_fotos(navegador, api):
    evento = api.criar_evento(f"{marca()} Congresso com fotos", no_mes_anterior(14),
                              link_galeria="https://drive.google.com/drive/folders/pasta-selenium")
    ir_ao_mes_anterior(navegador)

    clicar(navegador, f"{card(evento['nome'])}//a[{texto('Ver fotos')}]")
    esperar(navegador, EC.url_contains(f"{FRONT_URL}/eventos/{evento['evento_id']}-"))


def test_evento_futuro_nao_ganha_a_etiqueta(navegador, api):
    evento = api.criar_evento(f"{marca()} Encontro futuro", dias_a_partir_de_hoje(2))
    abrir(navegador, "/")
    visivel(navegador, SECAO)
    # Perto da virada do mês, o evento de daqui a 2 dias cai no mês seguinte.
    if not existe(navegador, card(evento["nome"]), 3):
        clicar(navegador, f"{SECAO}//button[@aria-label='Próximo mês']")

    elemento = visivel(navegador, card(evento["nome"]))
    assert elemento.get_attribute("data-passado") is None
    assert "Já aconteceu" not in elemento.text
