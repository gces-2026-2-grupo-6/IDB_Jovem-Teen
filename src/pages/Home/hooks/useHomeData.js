import { useState, useEffect } from "react";
import {
  fetchAllEvents,
  fetchAggregatedGallery,
  isOngoingOrFuture,
  dateSortKey,
} from "../../../services/eventService";
import { getCountdown } from "../../../utils/formatDate";

export function useHomeData() {
  const [events, setEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [countdown, setCountdown] = useState(getCountdown(null));
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    let active = true;
    fetchAllEvents()
      .then((all) => {
        if (!active) return;
        setEvents(all);
        /* O destaque é o primeiro evento que ainda não terminou.

           Antes o filtro era `isFutureEvent(e.date)`, que olha só a data de
           **início**: um evento de vários dias já em curso não contava como
           próximo, e a home anunciava outro mais distante — ou nenhum.

           E o reserva era `all[0]`, o primeiro da ordem da API. Sem evento
           futuro, a home exibia "PRÓXIMO EVENTO" apontando para um evento
           **que já aconteceu**, com contagem zerada e um botão "Ver evento"
           levando ao congresso de 2020. Sem nada em cartaz, agora não há
           destaque — e a seção se esconde. */
        const emCartaz = all
          .filter(isOngoingOrFuture)
          .sort((a, b) => dateSortKey(a.date) - dateSortKey(b.date));
        setNextEvent(emCartaz[0] || null);
      })
      .catch(() => active && setEvents([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchAggregatedGallery()
      .then((fotos) => active && setGallery(fotos))
      .catch(() => active && setGallery([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!nextEvent?.date) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(nextEvent.date));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  return { countdown, events, gallery, nextEvent };
}
