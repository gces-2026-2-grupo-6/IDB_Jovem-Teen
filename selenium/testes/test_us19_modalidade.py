"""US19 — Eventos online e presenciais separados.

Fluxo completo, do cadastro no painel até o que o visitante vê, com o
back-end real gravando a modalidade.
"""

import re

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from apoio import (
    abrir, clicar, contem, dias_a_partir_de_hoje, entrar, esperar, existe,
    marca, preencher, preencher_data, texto, visivel,
)

pytestmark = pytest.mark.us19

LINK = "https://youtube.com/live/idbjovem-selenium"


def preencher_basico(driver, nome, inicio):
    preencher(visivel(driver, "//input[@placeholder='Nome do Evento']"), nome)
    Select(driver.find_element(By.NAME, "tipoEvento")).select_by_visible_text("Conferência")
    dia = inicio.strftime("%Y-%m-%d")
    preencher_data(driver, "startDay", dia)
    preencher_data(driver, "startTime", "19:00")
    preencher_data(driver, "endDay", dia)
    preencher_data(driver, "endTime", "21:00")


def card_do_evento(nome):
    return f"//div[contains(@class,'grid')]/div[.//h3[{texto(nome)}]]"


def test_cadastro_online_grava_sem_endereco_e_com_link(navegador, api):
    nome = f"{marca()} Live de oração"
    entrar(navegador)
    abrir(navegador, "/admin/eventos/criar")
    preencher_basico(navegador, nome, dias_a_partir_de_hoje(20))

    clicar(navegador, f"//button[@role='radio'][{texto('Online')}]")
    assert not existe(navegador, "//input[@placeholder='Digite o nome ou endereço do local']", 1)
    preencher(visivel(navegador, "//input[@id='linkTransmissao']"), LINK)
    clicar(navegador, "//button[normalize-space()='Salvar']")

    esperar(navegador, EC.url_matches(r"/admin/eventos/\d+/programacao"))
    evento_id = re.search(r"/admin/eventos/(\d+)/", navegador.current_url).group(1)
    api.registrar(f"/evento/{evento_id}")

    gravado = api.evento(evento_id).json()
    assert gravado["modalidade"] == "online"
    assert gravado["link_transmissao"] == LINK
    assert gravado["local_latitude"] is None and gravado["local_longitude"] is None


def test_link_sem_https_e_recusado_antes_de_salvar(navegador, api):
    entrar(navegador)
    abrir(navegador, "/admin/eventos/criar")
    preencher_basico(navegador, f"{marca()} Live com link errado", dias_a_partir_de_hoje(20))
    clicar(navegador, f"//button[@role='radio'][{texto('Online')}]")
    preencher(visivel(navegador, "//input[@id='linkTransmissao']"), "youtube.com/live")
    # O campo é type=url e o navegador já barraria; a regra também está no serviço.
    navegador.execute_script("document.querySelector('form').setAttribute('novalidate', '')")
    clicar(navegador, "//button[normalize-space()='Salvar']")

    alerta = esperar(navegador, EC.alert_is_present())
    assert "https://" in alerta.text
    alerta.accept()
    assert "/admin/eventos/criar" in navegador.current_url


def test_presencial_que_vira_online_perde_o_endereco(navegador, api):
    evento = api.criar_evento(f"{marca()} Retiro", dias_a_partir_de_hoje(25))
    entrar(navegador)
    abrir(navegador, f"/admin/eventos/{evento['evento_id']}/editar")

    radio_presencial = visivel(navegador, f"//button[@role='radio'][{texto('Presencial')}]")
    assert radio_presencial.get_attribute("aria-checked") == "true"
    clicar(navegador, f"//button[@role='radio'][{texto('Online')}]")
    preencher(visivel(navegador, "//input[@id='linkTransmissao']"), LINK)
    clicar(navegador, "//button[normalize-space()='Salvar']")
    esperar(navegador, EC.url_matches(r"/admin/eventos$"))

    gravado = api.evento(evento["evento_id"]).json()
    assert gravado["modalidade"] == "online"
    assert gravado["link_transmissao"] == LINK
    assert gravado["local_latitude"] is None


def test_agenda_mostra_selo_e_filtra_por_modalidade(navegador, api):
    tag = marca()
    online = api.criar_evento(f"{tag} Culto online", dias_a_partir_de_hoje(15),
                              modalidade="online", link_transmissao=LINK)
    presencial = api.criar_evento(f"{tag} Congresso", dias_a_partir_de_hoje(16))
    abrir(navegador, "/eventos")

    card_online = visivel(navegador, card_do_evento(online["nome"]))
    card_presencial = visivel(navegador, card_do_evento(presencial["nome"]))
    assert card_online.find_element(By.XPATH, ".//*[@data-testid='selo-modalidade']").text == "Online"
    assert card_presencial.find_element(By.XPATH, ".//*[@data-testid='selo-modalidade']").text == "Presencial"
    assert "Evento online" in card_online.text

    Select(navegador.find_element(By.ID, "filter-modalidade")).select_by_visible_text("Online")
    visivel(navegador, card_do_evento(online["nome"]))
    assert not existe(navegador, card_do_evento(presencial["nome"]), 1)

    Select(navegador.find_element(By.ID, "filter-modalidade")).select_by_visible_text("Presencial")
    visivel(navegador, card_do_evento(presencial["nome"]))
    assert not existe(navegador, card_do_evento(online["nome"]), 1)


def test_agenda_fica_em_ordem_de_data(navegador, api):
    tag = marca()
    # Cadastrados fora de ordem: a lista tem de seguir a data, não o cadastro.
    depois = api.criar_evento(f"{tag} B depois", dias_a_partir_de_hoje(40))
    antes = api.criar_evento(f"{tag} A antes", dias_a_partir_de_hoje(30), modalidade="online")
    abrir(navegador, "/eventos")
    visivel(navegador, card_do_evento(depois["nome"]))

    titulos = [t.text for t in navegador.find_elements(By.XPATH, f"//div[contains(@class,'grid')]/div//h3[{contem(tag)}]")]
    assert titulos == [antes["nome"], depois["nome"]]


def test_pagina_do_evento_online_tem_o_botao_da_transmissao(navegador, api):
    com_link = api.criar_evento(f"{marca()} Live", dias_a_partir_de_hoje(10),
                                modalidade="online", link_transmissao=LINK)
    sem_link = api.criar_evento(f"{marca()} Culto sem link", dias_a_partir_de_hoje(11), modalidade="online")

    abrir(navegador, f"/eventos/{com_link['evento_id']}")
    assert visivel(navegador, "//*[@data-testid='selo-modalidade']").text == "Online"
    visivel(navegador, f"//*[{texto('Evento online')}]")
    botao = visivel(navegador, f"//a[{texto('Assistir à transmissão')}]")
    assert botao.get_attribute("href") == LINK
    assert botao.get_attribute("target") == "_blank"

    abrir(navegador, f"/eventos/{sem_link['evento_id']}")
    visivel(navegador, "//*[@data-testid='selo-modalidade']")
    assert not existe(navegador, f"//a[{texto('Assistir à transmissão')}]", 1)


def test_evento_presencial_continua_com_endereco(navegador, api):
    evento = api.criar_evento(f"{marca()} Congresso presencial", dias_a_partir_de_hoje(12))
    abrir(navegador, f"/eventos/{evento['evento_id']}")
    assert visivel(navegador, "//*[@data-testid='selo-modalidade']").text == "Presencial"
    assert not existe(navegador, f"//a[{texto('Assistir à transmissão')}]", 1)
