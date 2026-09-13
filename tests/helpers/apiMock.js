// Mock stateful do backend REST + serviços externos (Nominatim/mapa/imagens)
// usados pelas páginas admin e públicas. Cada chamada a `setupApiMock(page)`
// cria um estado em memória novo e intercepta as requisições da página,
// evitando depender de um backend/Keycloak reais nos testes E2E.
//
// As formas de dados seguem o contrato da API (snake_case: evento_id, nome,
// data_inicio, ...) porque é isso que os adapters em src/services esperam.

const pad = (n) => String(n).padStart(2, "0");

/* Data no mês atual e no futuro (ou hoje), para alimentar "Próximos eventos"
   e o carrossel da página pública de eventos (que filtra pelo mês corrente). */
function currentMonthDate() {
  const now = new Date();
  const day = now.getDate() <= 26 ? now.getDate() + 2 : now.getDate();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`;
}

/* Cria um conjunto de dados isolado para cada teste */
function makeSeed() {
  const soonDay = currentMonthDate(); // YYYY-MM-DD no mês atual

  return {
    events: [
      {
        evento_id: 1,
        nome: "Retiro de Verão",
        descricao: "Um retiro incrível para os jovens.",
        data_inicio: `${soonDay}T08:00:00`,
        data_fim: `${soonDay}T18:00:00`,
        nome_local: "Sítio Boa Vista",
        local_latitude: -8.05,
        local_longitude: -34.9,
        link_galeria: "pasta-retiro",
        formulario_link: "https://forms.gle/retiro",
        link_imagem: "",
        calendario_evento_id: null,
      },
      {
        evento_id: 2,
        nome: "Acampamento Jovem",
        descricao: "Acampamento de fim de semana.",
        data_inicio: "2030-03-10T08:00:00",
        data_fim: "2030-03-12T18:00:00",
        nome_local: "Camping Serra Azul",
        local_latitude: -8.1,
        local_longitude: -35.0,
        link_galeria: "",
        formulario_link: "",
        link_imagem: "",
        calendario_evento_id: null,
      },
      {
        evento_id: 3,
        nome: "Congresso 2020",
        descricao: "Congresso anterior.",
        data_inicio: "2020-05-01T08:00:00",
        data_fim: "2020-05-03T18:00:00",
        nome_local: "Centro de Convenções",
        local_latitude: -8.06,
        local_longitude: -34.88,
        link_galeria: "pasta-congresso",
        formulario_link: "https://forms.gle/congresso",
        link_imagem: "",
        calendario_evento_id: null,
      },
      {
        // Evento passado com campos opcionais vazios → exercita os fallbacks "—"
        evento_id: 77777,
        nome: "Evento Null Fields",
        descricao: "",
        data_inicio: "2019-01-01T00:00:00",
        data_fim: "2019-01-01T00:00:00",
        nome_local: "",
        local_latitude: null,
        local_longitude: null,
        link_galeria: "",
        formulario_link: "",
        link_imagem: "",
        calendario_evento_id: null,
      },
    ],
    activities: [
      {
        atividade_id: 10,
        evento_id: 1,
        nome: "Abertura",
        descricao: "Boas-vindas e avisos.",
        horario_inicio: `${soonDay}T17:00:00`,
        horario_termino: `${soonDay}T18:00:00`,
      },
      {
        atividade_id: 11,
        evento_id: 1,
        nome: "Louvor",
        descricao: "Momento de louvor.",
        horario_inicio: `${soonDay}T18:00:00`,
        horario_termino: `${soonDay}T19:00:00`,
      },
      {
        atividade_id: 12,
        evento_id: 1,
        nome: "Ministração",
        descricao: "Palavra da noite.",
        horario_inicio: `${soonDay}T19:00:00`,
        horario_termino: `${soonDay}T20:30:00`,
      },
      {
        atividade_id: 13,
        evento_id: 1,
        nome: "Encerramento",
        descricao: "Comunhão final.",
        horario_inicio: `${soonDay}T20:30:00`,
        horario_termino: `${soonDay}T21:00:00`,
      },
    ],
    // Palestrantes/participantes por evento
    speakers: {
      1: [
        { participante_id: 201, nome: "Pr. André", profissao: "Pastor", link_foto: "" },
        { participante_id: 202, nome: "Banda Luz", profissao: "Ministério de Louvor", link_foto: "" },
        { participante_id: 203, nome: "Pra. Beatriz", profissao: "Conferencista", link_foto: "" },
        { participante_id: 204, nome: "DJ Paz", profissao: "Músico", link_foto: "" },
      ],
      2: [
        { participante_id: 211, nome: "Pr. Carlos", profissao: "Pastor", link_foto: "" },
        { participante_id: 212, nome: "Banda Vida", profissao: "Louvor", link_foto: "" },
        { participante_id: 213, nome: "Pra. Diana", profissao: "Conferencista", link_foto: "" },
        { participante_id: 214, nome: "Coral IDB", profissao: "Coral", link_foto: "" },
      ],
    },
    // Fotos de galeria por evento (formato da API: nome + url_visualizacao)
    galleries: {
      1: [
        { id: "g1", nome: "foto1.jpg", url_visualizacao: "https://lh3.googleusercontent.com/d/foto1=w1200" },
        { id: "g2", nome: "foto2.jpg", url_visualizacao: "https://lh3.googleusercontent.com/d/foto2=w1200" },
      ],
      3: [
        { id: "g3", nome: "foto3.jpg", url_visualizacao: "https://lh3.googleusercontent.com/d/foto3=w1200" },
      ],
    },
    // Líderes (organograma da Home e CRUD do painel)
    lideres: [
      { lider_id: 301, nome: "João Diretor", cargo: "Diretor Nacional de Jovens", regiao: "Nacional", ordem: 1, is_antigo: false, imagem_url: "https://lh3.googleusercontent.com/d/lider301=w1200", bio: "Bio do João.", redes_sociais: "@joao", gestao: "" },
      { lider_id: 302, nome: "Maria Diretora", cargo: "Diretora Nacional de Adolescentes", regiao: "Nacional", ordem: 2, is_antigo: false, imagem_url: "https://lh3.googleusercontent.com/d/lider302=w1200", bio: "", redes_sociais: "", gestao: "" },
      { lider_id: 303, nome: "Pedro Líder", cargo: "Diretor Regional de Jovens", regiao: "Região Sul", ordem: 3, is_antigo: false, imagem_url: "https://lh3.googleusercontent.com/d/lider303=w1200", bio: "", redes_sociais: "", gestao: "" },
      { lider_id: 304, nome: "Antiga Diretora", cargo: "Diretora Nacional de Adolescentes", regiao: "Nacional", ordem: 1, is_antigo: true, imagem_url: "https://lh3.googleusercontent.com/d/lider304=w1200", bio: "", redes_sociais: "", gestao: "2020 – 2023" },
      { lider_id: 305, nome: "Antigo Diretor", cargo: "Diretor Nacional de Jovens", regiao: "Nacional", ordem: 2, is_antigo: true, imagem_url: "https://lh3.googleusercontent.com/d/lider305=w1200", bio: "", redes_sociais: "", gestao: "2017 – 2020" },
    ],
    products: [
      {
        produto_id: 1,
        nome: "Camiseta IDB",
        descricao: "Camiseta oficial do IDB Jovem.",
        link_produto: "https://hotmart.com/camiseta",
        link_imagem: "",
      },
      {
        produto_id: 2,
        nome: "Caneca IDB",
        descricao: "Caneca personalizada.",
        link_produto: "https://hotmart.com/caneca",
        link_imagem: "",
      },
      {
        produto_id: 3,
        nome: "Boné IDB",
        descricao: "Boné estiloso.",
        link_produto: "https://hotmart.com/bone",
        link_imagem: "",
      },
    ],
    // Inscrições (voluntários) por evento
    inscricoes: [
      {
        evento_id: 1,
        voluntario_id: 100,
        nome: "Maria Silva",
        email: "maria@example.com",
        status: "pendente",
        resposta_id: "r1",
        link_resposta: "https://forms.gle/resposta1",
      },
      {
        evento_id: 1,
        voluntario_id: 101,
        nome: "João Souza",
        email: "joao@example.com",
        status: "aprovado",
        resposta_id: "r2",
        link_resposta: "",
      },
      {
        // Evento 2 não tem formulario_link e este voluntário não tem
        // link_resposta → o link "Abrir Formulário" cai no fallback "#".
        evento_id: 2,
        voluntario_id: 102,
        nome: "Ana Lima",
        email: "ana@example.com",
        status: "pendente",
        resposta_id: "r3",
        link_resposta: "",
      },
      {
        evento_id: 1000,
        voluntario_id: 9999,
        nome: 'Voluntário de Teste',
        email: 'teste@voluntario.com',
        status: 'pendente',
        resposta_id: 'r9999',
        link_resposta: '',
      }
    ],
    nextEventId: 1000,
    nextActivityId: 2000,
    nextProductId: 3000,
    nextLiderId: 400,
    nextSpeakerId: 500,
    nextVoluntarioId: 1000,
  };
}

const json = (data, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(data),
});

const notFound = () => json({ detail: "Não encontrado." }, 404);

/* PNG transparente 1x1 — usado para stubar imagens/tiles externos e evitar que
   o evento "load" da página fique pendurado esperando recursos de rede. */
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

export async function setupApiMock(page) {
  const db = makeSeed();

  /* Imagens e tiles externos → devolve um pixel para não travar o load */
  await page.route(
    /(via\.placeholder\.com|tile\.openstreetmap\.org|lh3\.googleusercontent\.com|unpkg\.com)/,
    (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: TRANSPARENT_PNG })
  );

  /* Busca de locais (LocationPicker chama o Nominatim direto via fetch) */
  await page.route(/nominatim\.openstreetmap\.org\/search/, (route) =>
    route.fulfill(
      json([
        {
          display_name: "Igreja IDB, Recife - PE",
          lat: "-8.047562",
          lon: "-34.877000",
        },
        {
          display_name: "Parque da Jaqueira, Recife - PE",
          lat: "-8.036000",
          lon: "-34.903000",
        },
      ])
    )
  );

  /* Backend REST. Ancorado logo após o host para NÃO interceptar as rotas do
     SPA (ex.: http://localhost:5173/admin/voluntarios), apenas as chamadas de
     API (ex.: http://localhost:8000/voluntarios/...). */
  await page.route(
    /^https?:\/\/[^/]+\/(evento|produto|voluntarios|formulario|mapa|lider|banda-palestrante)(\/|\?|$)/,
    async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());
      const path = url.pathname;
      let body = {};
      if (method === "POST" || method === "PUT") {
        try {
          body = JSON.parse(request.postData() || "{}");
        } catch {
          body = {};
        }
      }

      // ---------- MAPA ----------
      if (path.endsWith("/mapa/endereco")) {
        return route.fulfill(json({ nome_local: "Local de Teste" }));
      }

      // ---------- LIDERES ----------
      if (path.match(/\/lider\/?$/)) {
        if (method === "GET") {
          return route.fulfill(json(db.lideres));
        }
        if (method === "POST") {
          const created = {
            lider_id: db.nextLiderId++,
            nome: body.nome,
            cargo: body.cargo,
            imagem_url: body.imagem_url || "",
            is_antigo: !!body.is_antigo,
            ordem: body.ordem ?? 0,
            regiao: body.regiao || "",
            bio: body.bio || "",
            redes_sociais: body.redes_sociais || "",
            gestao: body.gestao || "",
          };
          db.lideres.push(created);
          return route.fulfill(json(created, 201));
        }
      }
      let m = path.match(/\/lider\/(\d+)$/);
      if (m) {
        const liderId = Number(m[1]);
        const idx = db.lideres.findIndex((l) => l.lider_id === liderId);
        if (method === "GET") {
          return route.fulfill(idx === -1 ? notFound() : json(db.lideres[idx]));
        }
        if (method === "PUT") {
          if (idx === -1) return route.fulfill(notFound());
          db.lideres[idx] = { ...db.lideres[idx], ...body, lider_id: liderId };
          return route.fulfill(json(db.lideres[idx]));
        }
        if (method === "DELETE") {
          if (idx !== -1) db.lideres.splice(idx, 1);
          return route.fulfill(json({}, 204));
        }
      }

      // ---------- BANDA/PALESTRANTE ----------
      m = path.match(/\/banda-palestrante\/(\d+)$/);
      if (m) {
        const spkId = Number(m[1]);
        const all = Object.values(db.speakers).flat();
        const idx = all.findIndex((s) => s.participante_id === spkId);
        if (method === "GET") {
          if (idx === -1) return route.fulfill(notFound());
          return route.fulfill(json(all[idx]));
        }
        if (method === "PUT") {
          // Find and update in the speakers map
          for (const evId of Object.keys(db.speakers)) {
            const si = db.speakers[evId].findIndex((s) => s.participante_id === spkId);
            if (si !== -1) {
              db.speakers[evId][si] = { ...db.speakers[evId][si], ...body, participante_id: spkId };
              return route.fulfill(json(db.speakers[evId][si]));
            }
          }
          return route.fulfill(notFound());
        }
        if (method === "DELETE") {
          for (const evId of Object.keys(db.speakers)) {
            const si = db.speakers[evId].findIndex((s) => s.participante_id === spkId);
            if (si !== -1) db.speakers[evId].splice(si, 1);
          }
          return route.fulfill(json({}, 204));
        }
      }
      if (path.match(/\/banda-palestrante\/?$/) && method === "GET") {
        const all = Object.values(db.speakers).flat();
        return route.fulfill(json(all));
      }
      if (path.match(/\/banda-palestrante\/?$/) && method === "POST") {
        const created = {
          participante_id: db.nextSpeakerId++,
          nome: body.nome,
          profissao: body.profissao || "",
          link_foto: body.link_foto || "",
        };
        // Add to event 1 speakers by default
        if (!db.speakers[1]) db.speakers[1] = [];
        db.speakers[1].push(created);
        return route.fulfill(json(created));
      }

      // ---------- FORMULARIO (inscrições por evento) ----------
      m = path.match(/\/formulario\/eventos\/(\d+)\/inscricoes$/);
      if (m) {
        const eventId = Number(m[1]);
        return route.fulfill(
          json(db.inscricoes.filter((i) => i.evento_id === eventId))
        );
      }

      // ---------- VOLUNTARIOS ----------
      m = path.match(/\/voluntarios\/(\d+)\/evento\/(\d+)\/status$/);
      if (m && method === "PATCH") {
        const voluntarioId = Number(m[1]);
        const eventId = Number(m[2]);
        const novoStatus = url.searchParams.get("novo_status");
        const insc = db.inscricoes.find(
          (i) => i.voluntario_id === voluntarioId && i.evento_id === eventId
        );
        if (insc) insc.status = novoStatus;
        return route.fulfill(
          json({
            voluntario_id: voluntarioId,
            evento_id: eventId,
            status: novoStatus,
            resposta_id: insc?.resposta_id || "",
          })
        );
      }
      m = path.match(/\/voluntarios\/(\d+)$/);
      if (m) {
        const volId = Number(m[1]);
        if (method === "GET") {
          const vol = db.inscricoes.find((i) => i.voluntario_id === volId);
          return route.fulfill(vol ? json({ voluntario_id: vol.voluntario_id, nome: vol.nome, email: vol.email }) : notFound());
        }
        if (method === "DELETE") {
          const idx = db.inscricoes.findIndex((i) => i.voluntario_id === volId);
          if (idx !== -1) db.inscricoes.splice(idx, 1);
          return route.fulfill(json({}, 204));
        }
      }
      m = path.match(/\/voluntarios\/evento\/(\d+)\/contagem$/);
      if (m) {
        const eventId = Number(m[1]);
        return route.fulfill(
          json(db.inscricoes.filter((i) => i.evento_id === eventId).length)
        );
      }
      m = path.match(/\/voluntarios\/evento\/(\d+)$/);
      if (m) {
        const eventId = Number(m[1]);
        return route.fulfill(
          json(db.inscricoes.filter((i) => i.evento_id === eventId))
        );
      }
      if (path.match(/\/voluntarios\/?$/) && method === "GET") {
        const all = db.inscricoes.map((i) => ({ voluntario_id: i.voluntario_id, nome: i.nome, email: i.email }));
        return route.fulfill(json(all));
      }
      if (path.match(/\/voluntarios\/?$/) && method === "POST") {
        const created = {
          voluntario_id: db.nextVoluntarioId++,
          nome: body.nome,
          email: body.email,
        };
        return route.fulfill(json(created));
      }

      // ---------- ATIVIDADES ----------
      m = path.match(/\/evento\/atividade\/(\d+)$/);
      if (m) {
        const actId = Number(m[1]);
        const idx = db.activities.findIndex((a) => a.atividade_id === actId);
        if (method === "PUT") {
          if (idx === -1) return route.fulfill(notFound());
          db.activities[idx] = { ...db.activities[idx], ...body, atividade_id: actId };
          return route.fulfill(json(db.activities[idx]));
        }
        if (method === "DELETE") {
          if (idx !== -1) db.activities.splice(idx, 1);
          return route.fulfill(json({}, 204));
        }
      }
      m = path.match(/\/evento\/(\d+)\/atividade$/);
      if (m) {
        const eventId = Number(m[1]);
        if (!db.events.some((e) => e.evento_id === eventId)) {
          return route.fulfill(notFound());
        }
        if (method === "GET") {
          return route.fulfill(
            json(db.activities.filter((a) => a.evento_id === eventId))
          );
        }
        if (method === "POST") {
          const created = {
            atividade_id: db.nextActivityId++,
            evento_id: eventId,
            nome: body.nome,
            descricao: body.descricao || "",
            horario_inicio: body.horario_inicio,
            horario_termino: body.horario_termino,
          };
          db.activities.push(created);
          return route.fulfill(json(created));
        }
      }

      // ---------- PARTICIPANTES (palestrantes do evento) ----------
      m = path.match(/\/evento\/(\d+)\/participantes\/(\d+)$/);
      if (m) {
        const eventId = Number(m[1]);
        const spkId = Number(m[2]);
        if (method === "POST") {
          // Link speaker to event
          if (!db.speakers[eventId]) db.speakers[eventId] = [];
          const all = Object.values(db.speakers).flat();
          const spk = all.find((s) => s.participante_id === spkId);
          if (spk && !db.speakers[eventId].find((s) => s.participante_id === spkId)) {
            db.speakers[eventId].push(spk);
          }
          return route.fulfill(json({ evento_id: eventId, participante_id: spkId }));
        }
        if (method === "DELETE") {
          if (db.speakers[eventId]) {
            const si = db.speakers[eventId].findIndex((s) => s.participante_id === spkId);
            if (si !== -1) db.speakers[eventId].splice(si, 1);
          }
          return route.fulfill(json({}, 204));
        }
      }
      m = path.match(/\/evento\/(\d+)\/participantes$/);
      if (m) {
        const eventId = Number(m[1]);
        return route.fulfill(json(db.speakers[eventId] || []));
      }

      // ---------- GALERIA ----------
      m = path.match(/\/evento\/(\d+)\/galeria$/);
      if (m) {
        const eventId = Number(m[1]);
        return route.fulfill(json(db.galleries[eventId] || []));
      }

      // ---------- EVENTOS ----------
      if (path.match(/\/evento\/buscar$/)) {
        const termo = (url.searchParams.get("termo") || "").toLowerCase();
        return route.fulfill(
          json(db.events.filter((e) => e.nome.toLowerCase().includes(termo)))
        );
      }
      m = path.match(/\/evento\/(\d+)$/);
      if (m) {
        const eventId = Number(m[1]);
        const idx = db.events.findIndex((e) => e.evento_id === eventId);
        if (method === "GET") {
          // Evento inexistente → 200 com null, para o front renderizar a tela
          // de "Evento não encontrado." (em vez de cair no estado de erro)
          if (idx === -1) return route.fulfill(json(null));
          return route.fulfill(json(db.events[idx]));
        }
        if (method === "PUT") {
          if (idx === -1) return route.fulfill(notFound());
          db.events[idx] = { ...db.events[idx], ...body, evento_id: eventId };
          return route.fulfill(json(db.events[idx]));
        }
        if (method === "DELETE") {
          if (idx !== -1) db.events.splice(idx, 1);
          return route.fulfill(json({}, 204));
        }
      }
      if (path.match(/\/evento\/?$/)) {
        if (method === "GET") {
          return route.fulfill(json(db.events));
        }
        if (method === "POST") {
          const created = {
            evento_id: db.nextEventId++,
            nome: body.nome,
            descricao: body.descricao || "",
            data_inicio: body.data_inicio,
            data_fim: body.data_fim,
            nome_local: body.nome_local || "",
            local_latitude: body.local_latitude,
            local_longitude: body.local_longitude,
            link_galeria: body.link_galeria || "",
            formulario_link: body.formulario_link || "",
            link_imagem: body.link_imagem || "",
            calendario_evento_id: null,
          };
          db.events.push(created);
          return route.fulfill(json(created));
        }
      }

      // ---------- PRODUTOS ----------
      m = path.match(/\/produto\/(\d+)$/);
      if (m) {
        const prodId = Number(m[1]);
        const idx = db.products.findIndex((p) => p.produto_id === prodId);
        if (method === "GET") {
          if (idx === -1) return route.fulfill(notFound());
          return route.fulfill(json(db.products[idx]));
        }
        if (method === "PUT") {
          if (idx === -1) return route.fulfill(notFound());
          db.products[idx] = { ...db.products[idx], ...body, produto_id: prodId };
          return route.fulfill(json(db.products[idx]));
        }
        if (method === "DELETE") {
          if (idx !== -1) db.products.splice(idx, 1);
          return route.fulfill(json({}, 204));
        }
      }
      if (path.match(/\/produto\/?$/)) {
        if (method === "GET") {
          return route.fulfill(json(db.products));
        }
        if (method === "POST") {
          const created = {
            produto_id: db.nextProductId++,
            nome: body.nome,
            descricao: body.descricao || "",
            link_produto: body.link_produto || "",
            link_imagem: body.link_imagem || "",
          };
          db.products.push(created);
          return route.fulfill(json(created));
        }
      }

      // Fallback: rota conhecida mas não tratada → 404 controlado
      return route.fulfill(notFound());
    }
  );

  return db;
}
