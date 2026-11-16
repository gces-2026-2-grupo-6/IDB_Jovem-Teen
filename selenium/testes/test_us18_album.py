"""US18 — Excluir fotos específicas de um álbum.

Limite do ambiente local: sem as credenciais do Google, o back-end não lista
as fotos do Drive (responde 502). Por isso o fluxo de selecionar e excluir
fotos, que depende de o álbum ter fotos, fica coberto pelos testes Playwright
com a API simulada. Aqui fica o que o sistema real permite verificar: o
caminho até o álbum, os estados da tela e a permissão no servidor.
"""

import pytest
from selenium.webdriver.support import expected_conditions as EC

from apoio import (
    FRONT_URL, ClienteApi, abrir, clicar, dias_a_partir_de_hoje, entrar,
    esperar, existe, marca, texto, visivel,
)

pytestmark = pytest.mark.us18

ALBUM = f"//section[.//h2[contains(normalize-space(), 'Álbum do evento')]]"


def test_lista_de_eventos_leva_ao_album_de_evento_proximo(navegador, api):
    evento = api.criar_evento(f"{marca()} Retiro", dias_a_partir_de_hoje(20))
    entrar(navegador)
    abrir(navegador, "/admin/eventos")

    linha = f"//div[contains(@class,'items-center')][.//p[{texto(evento['nome'])}]][.//button[@title='Editar']]"
    clicar(navegador, f"{linha}//a[@aria-label='Abrir evento e álbum']")
    esperar(navegador, EC.url_to_be(f"{FRONT_URL}/admin/eventos/{evento['evento_id']}"))
    visivel(navegador, ALBUM)


def test_evento_sem_album_avisa(navegador, api):
    evento = api.criar_evento(f"{marca()} Sem álbum", dias_a_partir_de_hoje(21))
    entrar(navegador)
    abrir(navegador, f"/admin/eventos/{evento['evento_id']}")

    visivel(navegador, f"{ALBUM}//p[{texto('Este evento não tem álbum de fotos cadastrado.')}]")
    assert not existe(navegador, f"{ALBUM}//button[contains(normalize-space(), 'Excluir selecionadas')]", 1)


def test_falha_ao_ler_o_album_nao_e_confundida_com_album_vazio(navegador, api):
    evento = api.criar_evento(f"{marca()} Com álbum", dias_a_partir_de_hoje(22),
                              link_galeria="https://drive.google.com/drive/folders/pasta-selenium")
    entrar(navegador)
    abrir(navegador, f"/admin/eventos/{evento['evento_id']}")

    visivel(navegador, f"{ALBUM}//*[@role='alert'][{texto('Não foi possível carregar o álbum.')}]")
    assert not existe(navegador, f"{ALBUM}//p[{texto('O álbum não tem fotos.')}]", 1)


def test_servidor_so_aceita_exclusao_de_fotos_da_superadmin(api):
    evento = api.criar_evento(f"{marca()} Permissão", dias_a_partir_de_hoje(23))
    corpo = {"fotos": ["arquivo-selenium"]}

    assert ClienteApi("eventos").post(f"/evento/{evento['evento_id']}/galeria/excluidas", corpo).status_code == 403
    assert api.post(f"/evento/{evento['evento_id']}/galeria/excluidas", corpo).status_code == 204
