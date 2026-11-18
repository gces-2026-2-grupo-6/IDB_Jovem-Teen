"""US02 — Informações completas do evento (vagas, contato, valor, link de
pagamento e regulamento).

O defeito que isto guardava — os cinco campos existiam no formulário desde a
Sprint 1, mas não eram enviados à API e o back-end não tinha as colunas, então
a administradora preenchia, salvava e os dados sumiam — foi corrigido (front e
back-end integrados na Sprint 4). O que era falha esperada (xfail estrito)
agora é regressão: o evento reaberto mantém o que foi preenchido.
"""

import re

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from apoio import (
    abrir, clicar, dias_a_partir_de_hoje, entrar, esperar, marca, preencher,
    preencher_data, texto, visivel,
)

pytestmark = pytest.mark.us02

CAMPOS = {
    "vagas": "120",
    "contatoResponsavel": "(61) 99999-0000",
    "valorInvestimento": "R$ 30,00",
    "linkPagamento": "https://pagamento.example.com/retiro",
    "linkRegulamento": "https://drive.google.com/file/d/regulamento-selenium/view",
}


def test_formulario_oferece_os_cinco_campos(navegador):
    entrar(navegador)
    abrir(navegador, "/admin/eventos/criar")
    visivel(navegador, "//input[@placeholder='Nome do Evento']")
    for nome in CAMPOS:
        assert navegador.find_elements(By.NAME, nome), nome


def test_campos_preenchidos_continuam_salvos_ao_reabrir_o_evento(navegador, api):
    entrar(navegador)
    abrir(navegador, "/admin/eventos/criar")
    preencher(visivel(navegador, "//input[@placeholder='Nome do Evento']"), f"{marca()} Retiro com vagas")
    Select(navegador.find_element(By.NAME, "tipoEvento")).select_by_visible_text("Conferência")
    dia = dias_a_partir_de_hoje(40).strftime("%Y-%m-%d")
    for nome, valor in (("startDay", dia), ("startTime", "09:00"), ("endDay", dia), ("endTime", "18:00")):
        preencher_data(navegador, nome, valor)
    for nome, valor in CAMPOS.items():
        campo = navegador.find_element(By.NAME, nome)
        navegador.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'instant'});", campo)
        preencher(campo, valor)
    # Online, para não depender da busca de endereço no mapa (serviço externo).
    clicar(navegador, f"//button[@role='radio'][{texto('Online')}]")
    clicar(navegador, "//button[normalize-space()='Salvar']")
    esperar(navegador, EC.url_matches(r"/admin/eventos/\d+/programacao"))
    evento_id = re.search(r"/admin/eventos/(\d+)/", navegador.current_url).group(1)
    api.registrar(f"/evento/{evento_id}")

    abrir(navegador, f"/admin/eventos/{evento_id}/editar")
    visivel(navegador, "//input[@placeholder='Nome do Evento']")
    for nome, valor in CAMPOS.items():
        assert navegador.find_element(By.NAME, nome).get_attribute("value") == valor, nome
