"""US07 — Galeria pública em álbuns por evento.

Sem as credenciais do Google o back-end não lista fotos, então o ambiente
local verifica o estado sem fotos: a galeria tem de dizer que não há fotos, e
não mostrar álbuns de exemplo como se fossem eventos reais (defeito #17).
"""

import pytest

from apoio import abrir, existe, texto, visivel

pytestmark = pytest.mark.us07


def test_sem_fotos_a_galeria_mostra_estado_vazio_honesto(navegador):
    abrir(navegador, "/galeria")
    visivel(navegador, f"//*[{texto('Nenhuma foto publicada ainda.')}]")
    for ficticio in ("Festival de Inverno", "Feira Cultural", "Evento Esportivo"):
        assert not existe(navegador, f"//*[{texto(ficticio)}]", 1), ficticio
