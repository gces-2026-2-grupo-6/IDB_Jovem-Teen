import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchEventById,
  fetchActivities,
  fetchEventGallery,
} from "../../../services/eventService";
import { fetchSpeakersByEvent } from "../../../services/speakerService";

export function useEventDetails() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchEventById(slug)
      .then(async (ev) => {
        if (!ev) {
          if (active) setError("Evento não encontrado");
          return;
        }
        const [schedule, fotos, speakers] = await Promise.all([
          fetchActivities(ev.id).catch(() => []),
          fetchEventGallery(ev.id).catch(() => []),
          fetchSpeakersByEvent(ev.id).catch(() => []),
        ]);
        /* As fotos seguem como objeto, e não só a URL de exibição: cada uma
           carrega também o `downloadUrl` que o botão "Baixar" usa (US11, CA5). */
        const gallery = fotos;
        if (active) setEvent({ ...ev, schedule, gallery, speakers });
      })
      .catch(() => active && setError("Evento não encontrado"))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [slug]);

  return { event, loading, error };
}
