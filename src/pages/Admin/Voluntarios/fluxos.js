/* Os dois fluxos de inscrição de um evento (US09).

   Mora num módulo próprio, e não junto do componente de abas, porque o Fast
   Refresh do Vite só funciona em arquivos que exportam apenas componentes. */
export const FLUXO = {
  PARTICIPANTES: "participantes",
  VOLUNTARIOS: "voluntarios",
};

/* Voluntários primeiro porque é por onde se chega: o menu, o card do evento e
   o painel levam todos a "Voluntários Inscritos". Abrir noutra aba faria a
   tela parecer outra. */
export const ABAS = [
  { id: FLUXO.VOLUNTARIOS, label: "Voluntários" },
  { id: FLUXO.PARTICIPANTES, label: "Participantes" },
];
