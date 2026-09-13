import { test, expect } from '@playwright/test';
import {
  dateSortKey,
  eventDayKeys,
  formatDate,
  formatDateRange,
  formatEventDates,
  formatEventTimeLabel,
  getEventStatus,
  isMultiDay,
  isNonConsecutive,
  isOngoingOrFuture,
  normalizeEventDays,
  occursInMonth,
} from '../../src/utils/eventDates.js';

/* Datas relativas a hoje, para os casos que dependem do "agora". */
const pad = (n) => String(n).padStart(2, '0');
const shiftDays = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
};
const iso = (d, hora = '08:00') =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${hora}:00`;

const UM_DIA = { date: '2026-07-10T08:00:00', endDate: '2026-07-10T18:00:00' };
const TRES_DIAS = { date: '2026-07-10T08:00:00', endDate: '2026-07-12T18:00:00' };
const VIRADA_DO_MES = { date: '2026-07-30T08:00:00', endDate: '2026-08-02T18:00:00' };

test.describe('isMultiDay', () => {
  test('evento de um dia não é multi-dia, mesmo com horários diferentes', () => {
    expect(isMultiDay(UM_DIA)).toBe(false);
  });

  test('evento que termina em outro dia é multi-dia', () => {
    expect(isMultiDay(TRES_DIAS)).toBe(true);
    expect(isMultiDay(VIRADA_DO_MES)).toBe(true);
  });

  test('sem data de término não é multi-dia', () => {
    expect(isMultiDay({ date: '2026-07-10T08:00:00' })).toBe(false);
    expect(isMultiDay(undefined)).toBe(false);
  });
});

test.describe('eventDayKeys', () => {
  test('evento de um dia devolve uma chave só', () => {
    expect(eventDayKeys(UM_DIA)).toEqual(['2026-07-10']);
  });

  test('evento de três dias devolve os três dias, na ordem', () => {
    expect(eventDayKeys(TRES_DIAS)).toEqual(['2026-07-10', '2026-07-11', '2026-07-12']);
  });

  test('atravessa a virada do mês sem furo nem repetição', () => {
    expect(eventDayKeys(VIRADA_DO_MES)).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ]);
  });

  test('término anterior ao início não gera lista vazia nem laço infinito', () => {
    expect(eventDayKeys({ date: '2026-07-10T08:00:00', endDate: '2026-07-05T18:00:00' })).toEqual([
      '2026-07-10',
    ]);
  });

  test('sem data de início devolve lista vazia', () => {
    expect(eventDayKeys({})).toEqual([]);
    expect(eventDayKeys(null)).toEqual([]);
  });
});

test.describe('occursInMonth', () => {
  test('evento de julho aparece em julho', () => {
    expect(occursInMonth(TRES_DIAS, 6, 2026)).toBe(true);
  });

  test('evento que cruza a virada aparece nos dois meses', () => {
    expect(occursInMonth(VIRADA_DO_MES, 6, 2026)).toBe(true);
    expect(occursInMonth(VIRADA_DO_MES, 7, 2026)).toBe(true);
  });

  test('não aparece em mês fora do intervalo', () => {
    expect(occursInMonth(VIRADA_DO_MES, 5, 2026)).toBe(false);
    expect(occursInMonth(VIRADA_DO_MES, 8, 2026)).toBe(false);
  });

  test('respeita a virada do ano', () => {
    const reveillon = { date: '2026-12-30T08:00:00', endDate: '2027-01-02T18:00:00' };
    expect(occursInMonth(reveillon, 11, 2026)).toBe(true);
    expect(occursInMonth(reveillon, 0, 2027)).toBe(true);
    expect(occursInMonth(reveillon, 11, 2027)).toBe(false);
  });

  test('sem data de início não ocorre em mês nenhum', () => {
    expect(occursInMonth({}, 6, 2026)).toBe(false);
  });
});

test.describe('dateSortKey', () => {
  test('ordena datas crescentemente', () => {
    expect(dateSortKey('2026-07-10T08:00:00')).toBeLessThan(dateSortKey('2026-07-12T08:00:00'));
    expect(dateSortKey('2026-07-10T08:00:00')).toBeLessThan(dateSortKey('2026-07-10T09:00:00'));
    expect(dateSortKey('2026-12-31T23:59:00')).toBeLessThan(dateSortKey('2027-01-01T00:00:00'));
  });

  test('data inválida vira 0, então não embaralha a ordenação', () => {
    expect(dateSortKey(null)).toBe(0);
    expect(dateSortKey('sem data')).toBe(0);
  });
});

test.describe('leitura da data sem deslocamento de fuso', () => {
  test('data sem hora mantém o dia (new Date a leria como UTC)', () => {
    expect(formatDate('2026-07-10')).toBe('10/07/2026');
  });

  test('meia-noite não volta um dia', () => {
    expect(formatDate('2026-07-10T00:00:00')).toBe('10/07/2026');
  });
});

test.describe('formatDateRange', () => {
  test('evento de um dia mostra uma data só', () => {
    expect(formatDateRange(UM_DIA.date, UM_DIA.endDate)).toBe('10/07/2026');
  });

  test('evento de vários dias mostra a faixa', () => {
    expect(formatDateRange(TRES_DIAS.date, TRES_DIAS.endDate)).toBe('10/07/2026 - 12/07/2026');
  });

  test('sem término mostra só o início', () => {
    expect(formatDateRange('2026-07-10T08:00:00', null)).toBe('10/07/2026');
  });
});

test.describe('formatEventTimeLabel', () => {
  test('evento de um dia mantém o intervalo curto', () => {
    expect(formatEventTimeLabel(UM_DIA)).toBe('08:00 - 18:00');
  });

  test('evento de vários dias nomeia os horários, que seriam ambíguos', () => {
    expect(formatEventTimeLabel(TRES_DIAS)).toBe('Início 08:00 · Término 18:00');
  });

  test('sem data nenhuma devolve string vazia', () => {
    expect(formatEventTimeLabel({})).toBe('');
  });
});

test.describe('status de evento de vários dias', () => {
  test('evento já iniciado e ainda não terminado está em andamento', () => {
    const emAndamento = { date: iso(shiftDays(-2)), endDate: iso(shiftDays(3), '18:00') };
    expect(getEventStatus(emAndamento)).toBe('ongoing');
    /* É este o corte que mantém o evento no calendário da home: pela data de
       início ele já é passado. */
    expect(isOngoingOrFuture(emAndamento)).toBe(true);
  });

  test('evento que terminou ontem é passado', () => {
    const passado = { date: iso(shiftDays(-5)), endDate: iso(shiftDays(-1), '18:00') };
    expect(getEventStatus(passado)).toBe('past');
    expect(isOngoingOrFuture(passado)).toBe(false);
  });

  test('evento que ainda não começou é futuro', () => {
    const futuro = { date: iso(shiftDays(5)), endDate: iso(shiftDays(8), '18:00') };
    expect(getEventStatus(futuro)).toBe('upcoming');
    expect(isOngoingOrFuture(futuro)).toBe(true);
  });

  test('evento que termina hoje ainda conta como em andamento', () => {
    const terminaHoje = { date: iso(shiftDays(-3)), endDate: iso(shiftDays(0), '23:59') };
    expect(isOngoingOrFuture(terminaHoje)).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Dias não consecutivos — três sábados seguidos, o caso que o campo
 * data_inicio/data_fim não consegue representar.
 * ------------------------------------------------------------------ */

const TRES_SABADOS = {
  date: '2026-07-04T08:00:00',
  endDate: '2026-07-18T18:00:00',
  days: ['2026-07-04', '2026-07-11', '2026-07-18'],
};

const DIAS_CORRIDOS = {
  date: '2026-07-10T08:00:00',
  endDate: '2026-07-12T18:00:00',
  days: ['2026-07-10', '2026-07-11', '2026-07-12'],
};

test.describe('normalizeEventDays', () => {
  test('ordena, remove repetição e corta a hora', () => {
    expect(
      normalizeEventDays(['2026-07-18T08:00', '2026-07-04', '2026-07-11', '2026-07-04'])
    ).toEqual(['2026-07-04', '2026-07-11', '2026-07-18']);
  });

  test('aceita objetos, porque o formato do campo da API pode mudar', () => {
    expect(normalizeEventDays([{ data: '2026-07-11' }, { dia: '2026-07-04' }])).toEqual([
      '2026-07-04',
      '2026-07-11',
    ]);
  });

  test('entrada inválida ou ausente vira lista vazia', () => {
    expect(normalizeEventDays(null)).toEqual([]);
    expect(normalizeEventDays('2026-07-04')).toEqual([]);
    expect(normalizeEventDays([null, '', 'xx'])).toEqual([]);
  });
});

test.describe('isNonConsecutive', () => {
  test('três sábados são dias não consecutivos', () => {
    expect(isNonConsecutive(TRES_SABADOS)).toBe(true);
  });

  test('lista de dias corridos descreve um período, não dias avulsos', () => {
    expect(isNonConsecutive(DIAS_CORRIDOS)).toBe(false);
  });

  test('evento sem lista de dias nunca é não consecutivo', () => {
    expect(isNonConsecutive(TRES_DIAS)).toBe(false);
    expect(isNonConsecutive(UM_DIA)).toBe(false);
    expect(isNonConsecutive({ days: ['2026-07-04'] })).toBe(false);
  });
});

test.describe('eventDayKeys com dias específicos', () => {
  test('devolve exatamente os dias marcados, sem preencher os vãos', () => {
    expect(eventDayKeys(TRES_SABADOS)).toEqual([
      '2026-07-04',
      '2026-07-11',
      '2026-07-18',
    ]);
  });

  test('a lista tem precedência sobre o intervalo início/fim', () => {
    /* O intervalo cobriria quinze dias; os marcados são três. */
    expect(eventDayKeys(TRES_SABADOS)).toHaveLength(3);
  });

  test('sem lista, segue enumerando o período contínuo', () => {
    expect(eventDayKeys({ ...TRES_SABADOS, days: [] })).toHaveLength(15);
  });
});

test.describe('occursInMonth com dias específicos', () => {
  const ATRAVESSA = {
    date: '2026-07-25T08:00:00',
    endDate: '2026-09-05T18:00:00',
    days: ['2026-07-25', '2026-09-05'],
  };

  test('aparece nos meses em que tem dia marcado', () => {
    expect(occursInMonth(ATRAVESSA, 6, 2026)).toBe(true);
    expect(occursInMonth(ATRAVESSA, 8, 2026)).toBe(true);
  });

  test('não aparece no mês do meio, em que não acontece nada', () => {
    /* Pelo intervalo contínuo, agosto estaria dentro. */
    expect(occursInMonth(ATRAVESSA, 7, 2026)).toBe(false);
  });
});

test.describe('isMultiDay com dias específicos', () => {
  test('mais de um dia marcado é multi-dia', () => {
    expect(isMultiDay(TRES_SABADOS)).toBe(true);
  });

  test('um único dia marcado não é multi-dia, mesmo com endDate em outro dia', () => {
    expect(
      isMultiDay({ date: '2026-07-04T08:00', endDate: '2026-07-18T18:00', days: ['2026-07-04'] })
    ).toBe(false);
  });
});

test.describe('formatEventDates', () => {
  test('dias avulsos no mesmo mês comprimem mês e ano', () => {
    expect(formatEventDates(TRES_SABADOS)).toBe('04, 11 e 18/07/2026');
  });

  test('dias avulsos em meses diferentes mostram data completa', () => {
    expect(
      formatEventDates({
        date: '2026-07-25T08:00',
        endDate: '2026-08-01T18:00',
        days: ['2026-07-25', '2026-08-01'],
      })
    ).toBe('25/07/2026 e 01/08/2026');
  });

  test('período contínuo continua com a faixa de hífen', () => {
    expect(formatEventDates(TRES_DIAS)).toBe('10/07/2026 - 12/07/2026');
    expect(formatEventDates(DIAS_CORRIDOS)).toBe('10/07/2026 - 12/07/2026');
  });

  test('evento de um dia mostra uma data só', () => {
    expect(formatEventDates(UM_DIA)).toBe('10/07/2026');
  });
});

test.describe('formatEventTimeLabel com dias específicos', () => {
  test('o horário se repete em cada dia, então o intervalo curto volta a valer', () => {
    expect(formatEventTimeLabel(TRES_SABADOS)).toBe('08:00 - 18:00 em cada dia');
  });

  test('período contínuo segue nomeando início e término', () => {
    expect(formatEventTimeLabel(TRES_DIAS)).toBe('Início 08:00 · Término 18:00');
  });
});
