"""US20 — Exclusão de evento com inscritos (Opção A: apagar tudo junto).

O modal conta, no back-end real, o que sai junto com o evento; a exclusão
apaga o evento e os vínculos, mas não o cadastro dos convidados.
"""

import pytest
import requests

from apoio import (
    API_URL, ClienteApi, abrir, clicar, dias_a_partir_de_hoje, entrar, existe,
    marca, sumir, texto, visivel,
)

pytestmark = pytest.mark.us20

MODAL = "//h3[normalize-space()='Tem certeza que deseja excluir este evento?']"
RESUMO = "//*[@data-testid='resumo-exclusao']"


def linha_do_evento(nome):
    return f"//div[contains(@class,'items-center')][.//p[{texto(nome)}]][.//button[@title='Editar']]"


def abrir_exclusao(driver, nome):
    abrir(driver, "/admin/eventos")
    clicar(driver, f"{linha_do_evento(nome)}//button[@title='Excluir']")
    visivel(driver, MODAL)


def test_modal_mostra_programacao_e_convidados_que_saem_junto(navegador, api):
    tag = marca()
    inicio = dias_a_partir_de_hoje(30)
    evento = api.criar_evento(f"{tag} Acampamento", inicio)
    api.criar_atividade(evento["evento_id"], "Abertura", inicio)
    api.criar_atividade(evento["evento_id"], "Louvor", inicio)
    convidado = api.criar_convidado(f"{tag} Banda")
    api.vincular_convidado(evento["evento_id"], convidado["participante_id"])

    entrar(navegador)
    abrir_exclusao(navegador, evento["nome"])

    resumo = visivel(navegador, RESUMO).text
    assert "Saem junto com o evento 2 atividades da programação e 1 vínculo com convidado." in resumo
    assert "O cadastro dos convidados continua." in resumo
    assert "O evento também sai da agenda do Google." in resumo


def test_confirmar_apaga_o_evento_mas_mantem_o_cadastro_do_convidado(navegador, api):
    tag = marca()
    inicio = dias_a_partir_de_hoje(31)
    evento = api.criar_evento(f"{tag} Congresso", inicio)
    atividade = api.criar_atividade(evento["evento_id"], "Abertura", inicio)
    convidado = api.criar_convidado(f"{tag} Pregador", "Pregador")
    api.vincular_convidado(evento["evento_id"], convidado["participante_id"])

    entrar(navegador)
    abrir_exclusao(navegador, evento["nome"])
    visivel(navegador, RESUMO)
    clicar(navegador, "//button[normalize-space()='Sim']")
    sumir(navegador, MODAL)
    sumir(navegador, linha_do_evento(evento["nome"]))
    api.esquecer(f"/evento/{evento['evento_id']}")

    assert api.evento(evento["evento_id"]).status_code == 404
    assert api.get(f"/evento/atividade/{atividade['atividade_id']}").status_code == 404
    assert api.get(f"/banda-palestrante/{convidado['participante_id']}").status_code == 200


def test_evento_sem_vinculos_avisa_que_nao_ha_inscricoes(navegador, api):
    evento = api.criar_evento(f"{marca()} Evento vazio", dias_a_partir_de_hoje(32))
    entrar(navegador)
    abrir_exclusao(navegador, evento["nome"])
    assert visivel(navegador, RESUMO).text == "Este evento não tem inscrições."


def test_responder_nao_mantem_o_evento(navegador, api):
    evento = api.criar_evento(f"{marca()} Seminário", dias_a_partir_de_hoje(33))
    entrar(navegador)
    abrir_exclusao(navegador, evento["nome"])
    visivel(navegador, RESUMO)
    clicar(navegador, "//button[normalize-space()='Não']")

    sumir(navegador, MODAL)
    visivel(navegador, linha_do_evento(evento["nome"]))
    assert api.evento(evento["evento_id"]).status_code == 200


def test_admin_de_eventos_nao_ve_a_lixeira(navegador, api):
    evento = api.criar_evento(f"{marca()} Vigília", dias_a_partir_de_hoje(34))
    entrar(navegador, "eventos")
    abrir(navegador, "/admin/eventos")

    visivel(navegador, linha_do_evento(evento["nome"]))
    assert not existe(navegador, f"{linha_do_evento(evento['nome'])}//button[@title='Excluir']", 1)


def test_servidor_recusa_exclusao_e_contagem_para_admin_de_eventos(api):
    evento = api.criar_evento(f"{marca()} Encontro", dias_a_partir_de_hoje(35))
    admin_eventos = ClienteApi("eventos")

    assert admin_eventos.get(f"/evento/{evento['evento_id']}/exclusao").status_code == 403
    assert admin_eventos.delete(f"/evento/{evento['evento_id']}").status_code == 403
    assert requests.delete(f"{API_URL}/evento/{evento['evento_id']}", timeout=10).status_code in (401, 403)
    assert api.evento(evento["evento_id"]).status_code == 200
