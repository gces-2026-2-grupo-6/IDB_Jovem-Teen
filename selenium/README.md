# Testes funcionais com Selenium

Testes de ponta a ponta que usam o site como a administradora e o visitante
usam: o **front de verdade**, logado pelo **Keycloak de verdade** e falando com
o **back-end e o banco de verdade**. São diferentes dos testes Playwright em
`tests/`, que rodam contra uma API simulada: aqui aparecem os defeitos de
integração entre front e back-end.

## Como rodar

Pré-requisitos: Docker, Python 3, Google Chrome e os repositórios
`IDB_Jovem-Teen` e `IDB_Jovem-Backend` lado a lado na mesma pasta (ou a
variável `BACKEND_DIR` apontando para o back-end).

```bash
cd selenium

# 1. Banco, Keycloak e back-end (a primeira vez constrói a imagem do back-end)
./ambiente/subir.sh

# 2. O front, apontando para esse back-end (em outro terminal, na raiz do repositório)
VITE_API_URL=http://localhost:8000 VITE_KEYCLOAK_URL=http://localhost:8080 \
VITE_KEYCLOAK_REALM=jovem VITE_KEYCLOAK_CLIENT_ID=jovem-backend \
npx vite --port 5173 --strictPort

# 3. Os testes
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/pytest                 # tudo
.venv/bin/pytest -m us19         # só uma história
HEADLESS=0 .venv/bin/pytest -m us20   # vendo o navegador
HEADLESS=0 PAUSA_S=0.8 .venv/bin/pytest -m us19   # devagar, para apresentar

# 4. Ao terminar
./ambiente/descer.sh
```

O ambiente não lê nem altera o `.env` de ninguém: as variáveis estão em
`ambiente/docker-compose.yml`, e o banco é temporário (some no `descer.sh`).
O `preparar_keycloak.py` cria um usuário por perfil, todos com a senha
`selenium123`: `selenium-super`, `selenium-eventos`, `selenium-produtos` e
`selenium-inscricoes`. Ele também libera `http://localhost:5173` no CORS do
client `jovem-backend`, porque o `realm.json` só libera `localhost:8000`.

Quando um teste falha, o print da tela fica em `selenium/relatorio/`.

## O que está coberto

| História | Arquivo | O que verifica |
|---|---|---|
| US02 | `test_us02_informacoes_evento.py` | Os 5 campos existem no formulário; **bug**: não são gravados (xfail) |
| US03 | `test_us03_telas_separadas.py` | Painel inicial só com a agenda; Produtos com tela própria; admin da loja entra em Produtos e não abre a agenda |
| US04 | `test_us04_traducao.py` | `lang="pt-BR"` e `notranslate` em todas as páginas; nome do líder com `translate="no"` e sem duplicar |
| US05 | `test_us05_lideres.py` | Cadastrar, editar e excluir líder pela tela; tela só da superadmin; galeria de anteriores só com cargo nacional |
| US07 | `test_us07_galeria.py` | Sem fotos, a galeria diz que não há fotos e não mostra álbuns fictícios |
| US18 | `test_us18_album.py` | Atalho da lista até o álbum; evento sem álbum; falha do Drive não vira "álbum vazio"; servidor só aceita a exclusão da superadmin |
| US19 | `test_us19_modalidade.py` | Cadastro online gravado sem endereço e com link; link sem `https` recusado; presencial → online; selo, filtro e ordem por data na agenda; botão da transmissão |
| US20 | `test_us20_exclusao_evento.py` | Modal com a programação e os convidados que saem junto; exclusão mantém o cadastro do convidado; "Não" mantém o evento; admin de eventos sem lixeira; servidor recusa |
| US22 | `test_us22_missao_visao_valores.py` | "Saiba mais" e rodapé levam a Quem somos; missão publicada sem texto inventado; tela só da superadmin; aviso ao salvar; **lacuna**: conteúdo salvo não chega à página (xfail) |
| US23 | `test_us23_calendario.py` | Evento do mês passado com "Já aconteceu"; "Ver fotos" leva ao evento; evento futuro sem a etiqueta |
| — | `test_bugs_encontrados.py` | Defeitos fora das histórias do Trio 01 (xfail) |
| — | `test_entrega_do_build.py` | O que o servidor entrega: fallback da SPA em rota profunda, 404 da aplicação, navegação sem recarregar, guarda do painel com navegador limpo, `lang` e viewport do `index.html`; **achado**: a rota `/test-coverage` vai para produção expondo cinco serviços em `window` (xfail) |
| — | `test_producao.py` | O que está publicado: Keycloak do realm no ar, CORS da API, migrações da Sprint 3 no banco de produção, eventos saindo da API até a tela, o card de compartilhamento por evento servido ao robô de prévia (US08), a guarda dos links do painel e o login real |

Testes marcados com `xfail(strict=True)` descrevem o comportamento esperado
de algo que hoje está quebrado. Quando o defeito for corrigido, o pytest
acusa `XPASS` e o marcador deve sair, mantendo o teste como regressão.

### Os dois últimos não usam a pilha local

`test_entrega_do_build.py` e `test_producao.py` estão marcados com
`fora_do_ambiente`. Eles não precisam de banco, Keycloak nem back-end: um
olha para o que o servidor devolve antes de a aplicação montar, o outro para
o que está publicado. Por isso a verificação de ambiente do `conftest.py` é
dispensada quando a execução só tem desses — senão ela derrubaria a sessão
por falta de um ambiente que ninguém ia usar.

```bash
# só a entrega, contra um build servido localmente
npm run build && npx vite preview --port 4173 &
cd selenium && FRONT_URL=http://localhost:4173 pytest testes/test_entrega_do_build.py

# contra a produção, depois de cada deploy
ALVO=producao \
FRONT_URL=https://idbjovemeteen.tech \
API_URL=https://api.idbjovemeteen.tech \
KEYCLOAK_URL=https://auth.idbjovemeteen.tech \
pytest testes/test_producao.py testes/test_entrega_do_build.py
```

Sem `ALVO=producao` os testes de produção se declaram inconclusivos em vez de
falharem. Pular é melhor que falhar: falha que todo mundo sabe que vai
acontecer é falha que todo mundo aprende a ignorar.

No CI isso está em dois lugares: o job `Selenium (entrega do build)`, que
consome o mesmo artefato do job de E2E, e o workflow
`verificacao-producao.yml`, manual depois de cada deploy e agendado às
segundas.

## Defeitos encontrados

| Defeito | Onde | Teste |
|---|---|---|
| Os campos vagas, contato, valor, link de pagamento e regulamento são preenchidos no painel e somem ao salvar: o front não os envia e o back-end não tem as colunas | US02, front e back | `test_us02_…::test_campos_preenchidos_continuam_salvos_ao_reabrir_o_evento` |
| O back-end não tem `GET`/`PUT /institucional`: missão, visão e valores não podem ser salvos | US22, back | `test_us22_…::test_conteudo_salvo_no_painel_aparece_na_pagina_publica` |
| Excluir um convidado vinculado a um evento estoura `IntegrityError` no back-end; a requisição cai sem resposta e a tela mostra erro de rede (registrado pela QA na Sprint 2, ainda aberto) | US06, back | `test_bugs_encontrados.py` |

## Limites do ambiente local

- **Google Drive e Agenda ficam desligados** (não há credenciais). A galeria
  responde 502, então o fluxo de excluir fotos de um álbum com fotos (US18) e
  os álbuns da galeria com fotos (US07) continuam cobertos pelos testes
  Playwright, com a API simulada.
- Os testes evitam a busca de endereço no mapa (Nominatim, serviço externo):
  eventos presenciais são criados pela API.

## Como acrescentar testes da sua parte

1. Crie `testes/test_usXX_assunto.py` e marque com `pytestmark = pytest.mark.usXX`
   (registre o marcador em `pytest.ini`).
2. Use as fixtures `navegador` (Chrome) e `api` (API real como superadmin).
   Prepare os dados com `api.criar_evento(...)`, `api.criar_lider(...)` etc.:
   tudo o que o `api` cria é apagado no fim do teste. O que o teste criar pela
   tela, registre com `api.registrar("/evento/<id>")`.
3. Ponha `marca()` no nome dos dados, para não colidir com os de outro teste.
4. Faça login com `entrar(navegador, "super" | "eventos" | "produtos" | "inscricoes")`.
5. Espere pelos elementos com `visivel`, `clicar` e `sumir` de `apoio.py`, nunca
   com `time.sleep`.
6. Verifique na tela o que a pessoa vê; use a API só para preparar os dados
   ou conferir o que foi gravado.
