"""O que o servidor entrega ao visitante.

Os outros módulos desta pasta exercitam funcionalidade com a pilha de pé.
Este olha para outra coisa: o que o servidor devolve antes de a aplicação
montar, e o que o build publica junto sem ninguém ter pedido.

É por isso que ele não precisa de banco, Keycloak nem back-end — basta uma
instância do site servida em FRONT_URL. No CI é o artefato do job de build;
apontando FRONT_URL para a produção, são os mesmos testes contra o que está
publicado.

Cada teste entra pela URL, como quem recebeu um link pronto. Esse caminho
depende de configuração de servidor — e configuração de servidor é
justamente o que muda entre o build local e a produção.
"""

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from apoio import FRONT_URL, abrir, existe, texto

pytestmark = pytest.mark.fora_do_ambiente


def montar(driver, caminho="/"):
    """Abre o caminho e espera a aplicação montar.

    Esperar o `#root` ganhar filho é o equivalente honesto de "a SPA
    renderizou": o HTML servido é sempre o mesmo esqueleto, então afirmar
    sobre a página sem esperar testaria o esqueleto, não a aplicação.
    """
    abrir(driver, caminho)
    WebDriverWait(driver, 20).until(
        lambda d: d.execute_script(
            "return !!document.querySelector('#root') && "
            "document.querySelector('#root').children.length > 0"
        )
    )
    return driver


def corpo(driver):
    return driver.find_element(By.TAG_NAME, "body").text


def test_home_renderiza_a_identidade_do_projeto(navegador):
    montar(navegador)
    assert "IDB" in navegador.title, f"título inesperado: {navegador.title!r}"
    assert "IDB JOVEM & TEEN" in corpo(navegador).upper()


def test_rota_profunda_entra_direto_sem_404_do_servidor(navegador):
    """Abrir /eventos pela URL tem que cair na aplicação, não no 404 do servidor.

    Numa SPA, /eventos não é arquivo: existe só no roteador do navegador.
    Quem serve o site precisa devolver o index.html para qualquer caminho —
    é a regra de `rewrites` do vercel.json em produção e o fallback do
    `vite preview` no CI.

    A suíte Playwright não cobre isto de verdade: lá o 404 do servidor e o
    404 da aplicação renderizam telas parecidas o bastante para passar
    despercebido, e o fallback nunca foi afirmado explicitamente.
    """
    montar(navegador, "/eventos")
    assert navegador.current_url.rstrip("/").endswith("/eventos")
    assert "404" not in corpo(navegador), (
        "a rota profunda caiu no 404 do servidor — fallback da SPA quebrado"
    )
    assert navegador.find_elements(By.TAG_NAME, "nav"), "a aplicação não montou"


def test_rota_inexistente_mostra_o_404_da_aplicacao(navegador):
    """O inverso do anterior: o fallback não pode engolir tudo em silêncio.

    Devolver index.html para qualquer caminho está certo; o que não pode é a
    aplicação fingir que a rota existe. O 404 tem que ser o que o projeto
    escreveu.
    """
    montar(navegador, "/caminho-que-nao-existe-em-lugar-nenhum")
    assert existe(navegador, f"//*[{texto('404')}]", 10)
    assert "Página não encontrada" in corpo(navegador)


def test_menu_navega_sem_recarregar_a_pagina(navegador):
    """Clicar no menu troca a rota pelo roteador, não pelo servidor.

    A marca na `window` morre em qualquer recarregamento. Se sobreviver ao
    clique, a navegação foi da SPA; se sumir, o link virou navegação completa
    e o visitante paga um carregamento inteiro a cada clique.
    """
    montar(navegador)
    navegador.execute_script("window.__marcaDeNavegacao = 'viva';")

    link = navegador.find_element(By.CSS_SELECTOR, 'nav a[href="/eventos"]')
    navegador.execute_script("arguments[0].click();", link)
    WebDriverWait(navegador, 15).until(
        lambda d: d.current_url.rstrip("/").endswith("/eventos")
    )

    assert navegador.execute_script("return window.__marcaDeNavegacao;") == "viva", (
        "a navegação recarregou a página inteira"
    )


def test_login_apresenta_o_formulario_completo(navegador):
    montar(navegador, "/login")
    assert navegador.find_elements(By.CSS_SELECTOR, 'input[name="usuario"]')
    assert navegador.find_elements(By.CSS_SELECTOR, 'input[name="senha"]')
    assert navegador.find_elements(By.CSS_SELECTOR, 'form button[type="submit"]'), (
        "formulário de login sem botão de envio"
    )


def test_painel_administrativo_exige_sessao(navegador):
    """Entrar direto em /admin sem sessão tem que devolver ao login.

    A suíte Playwright cobre a guarda, mas sempre com o estado de
    autenticação montado pela própria ferramenta
    (tests/helpers/adminAuth.js). Aqui o navegador chega limpo, como chega
    quem recebeu o link do painel por engano.
    """
    montar(navegador, "/admin")
    WebDriverWait(navegador, 15).until(
        lambda d: d.current_url.rstrip("/").endswith("/login")
    )
    assert navegador.find_elements(By.CSS_SELECTOR, 'input[name="usuario"]')


def test_rota_de_pedidos_exige_sessao(navegador):
    """US21: a tela de pedidos do setor Produtos não é pública.

    `/admin/pedidos` é a tela da US21 (CA1/CA2). Como qualquer rota do
    painel, chegar nela sem sessão tem que devolver ao login — o visitante
    que recebeu o link por engano não pode ver pedido de ninguém. O controle
    que vale é o do servidor (o `GET /pedido/` exige o setor); aqui se
    verifica que a rota existe e que a guarda do front não a deixa aberta.
    """
    montar(navegador, "/admin/pedidos")
    WebDriverWait(navegador, 15).until(
        lambda d: d.current_url.rstrip("/").endswith("/login")
    )
    assert navegador.find_elements(By.CSS_SELECTOR, 'input[name="usuario"]')


def test_html_servido_declara_idioma_e_viewport(navegador):
    """Verificação do documento entregue, antes de a aplicação montar.

    São duas coisas que só existem no index.html publicado. Se o build
    perder qualquer uma, nenhum teste de tela percebe — mas leitor de tela e
    celular percebem.
    """
    navegador.get(f"{FRONT_URL}/")
    idioma = navegador.find_element(By.TAG_NAME, "html").get_attribute("lang")
    assert idioma and idioma.startswith("pt"), f"lang do documento: {idioma!r}"

    viewport = navegador.find_elements(By.CSS_SELECTOR, 'meta[name="viewport"]')
    assert viewport, "index.html sem meta viewport"
    assert "width=device-width" in viewport[0].get_attribute("content")


@pytest.mark.xfail(
    strict=True,
    reason=(
        "A rota /test-coverage é o arnês que a suíte Playwright usa para medir "
        "cobertura e hoje vai para produção, publicando cinco serviços em "
        "window (api, mapaService, productService, speakerService, "
        "volunteerService). Enquanto estiver na rota pública este teste falha "
        "de propósito; quando a rota sair do build de produção ele passa, "
        "o strict acusa XPASS e o marcador sai."
    ),
)
def test_arnes_de_teste_nao_vai_para_producao(navegador):
    """A página que existe para medir cobertura não pode ser publicada.

    O problema é exposição: `window.api` entrega o cliente HTTP já
    configurado — com o interceptador que anexa o token da sessão — para
    qualquer script que rode na página, numa rota pública.

    O peso no bundle, medido, é pequeno: tirar a rota leva o arquivo
    principal de 956,57 kB para 943,22 kB (3,65 kB a menos depois do gzip),
    porque quase tudo que ela importa já entra pelas telas de verdade. O
    argumento é exposição, não tamanho.

    O conserto não é apagar a página, que a suíte Playwright usa: é manter a
    rota fora do build de produção, condicionada a `import.meta.env`.
    """
    montar(navegador, "/test-coverage")
    expostos = navegador.execute_script(
        "return ['api','mapaService','productService','speakerService',"
        "'volunteerService'].filter(function (n) { return !!window[n]; });"
    )
    assert not expostos, f"serviços expostos em window: {expostos}"
    assert "404" in corpo(navegador), "a rota do arnês respondeu em produção"
