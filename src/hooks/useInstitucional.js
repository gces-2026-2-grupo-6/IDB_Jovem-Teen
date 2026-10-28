import { useEffect, useState } from "react";
import { CONTEUDO_PADRAO, fetchInstitucional, temConteudo } from "../services/institucionalService";

/* US22: conteúdo de missão, visão e valores. `salvo` é o que veio do servidor
   (ou `null`); `conteudo` é o que as telas exibem, caindo na missão já
   publicada quando ainda não há nada salvo. */
export default function useInstitucional() {
  const [estado, setEstado] = useState({ carregando: true, salvo: null });

  useEffect(() => {
    let ativo = true;
    fetchInstitucional().then((salvo) => {
      if (ativo) setEstado({ carregando: false, salvo });
    });
    return () => {
      ativo = false;
    };
  }, []);

  const conteudo = temConteudo(estado.salvo) ? estado.salvo : CONTEUDO_PADRAO;
  return { carregando: estado.carregando, salvo: estado.salvo, conteudo };
}
