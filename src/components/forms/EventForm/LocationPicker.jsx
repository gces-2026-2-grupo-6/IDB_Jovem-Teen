import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Loader2 } from "lucide-react";
import { fetchEndereco, buscarLocais } from "../../../services/mapaService";

/* Marcador laranja (ponto) — não depende das imagens do Leaflet */
const eventIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:9999px;background:#FF6D2C;border:3px solid #fff;box-shadow:0 0 0 3px rgba(255,109,44,0.4)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/* Centro padrão (Brasília) quando ainda não há ponto escolhido */
const DEFAULT_CENTER = [-15.7934, -47.8822];

/* Captura cliques no mapa */
function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* Recentraliza o mapa quando a posição muda (ex.: vinda da busca por nome) */
function RecenterOnPos({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 15, { animate: true });
  }, [pos, map]);
  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  initialAddress = "",
  onChange,
}) {
  const hasPos =
    latitude !== "" && latitude != null && longitude !== "" && longitude != null;
  const pos = hasPos ? [Number(latitude), Number(longitude)] : null;

  const [address, setAddress] = useState(initialAddress);
  const [loadingAddr, setLoadingAddr] = useState(false);

  // Busca por nome
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  // Busca com debounce enquanto o usuário digita
  const handleQueryChange = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    const termo = value.trim();
    if (termo.length < 3) {
      setResults([]);
      setSearching(false);
      setShowResults(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const locais = await buscarLocais(termo);
      setResults(locais);
      setShowResults(true);
      setSearching(false);
    }, 450);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Fecha a lista de sugestões ao clicar fora
  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handlePick = async (lat, lng) => {
    onChange(lat, lng);
    setAddress("");
    setLoadingAddr(true);
    const nome = await fetchEndereco(lat, lng);
    setAddress(nome || "");
    setLoadingAddr(false);
  };

  const handleSelectResult = (local) => {
    onChange(local.latitude, local.longitude);
    setAddress(local.nome);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div>
      {/* Busca por nome do local */}
      <div ref={boxRef} className="relative mb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/30"
          />
          <input
            type="text"
            aria-label="Buscar endereço do local"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => results.length && setShowResults(true)}
            placeholder="Digite o nome ou endereço do local"
            className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-3 bg-[#FFF8F3] text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/40 focus:border-[#FF6D2C] focus:ring-2 focus:ring-[#FF6D2C]/20 transition-all"
          />
          {searching && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF6D2C] animate-spin"
            />
          )}
        </div>

        {showResults && (
          <ul className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {results.length > 0 ? (
              results.map((local, i) => (
                <li key={`${local.latitude}-${local.longitude}-${i}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(local)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#1E1E1E] hover:bg-[#FFF1E8] flex items-start gap-2"
                  >
                    <MapPin size={15} className="text-[#FF6D2C] shrink-0 mt-0.5" />
                    <span>{local.nome}</span>
                  </button>
                </li>
              ))
            ) : (
              !searching && (
                <li className="px-4 py-2.5 text-sm text-[#1E1E1E]/50">
                  Nenhum local encontrado.
                </li>
              )
            )}
          </ul>
        )}
      </div>

      <div className="h-[320px] w-full rounded-xl overflow-hidden border border-gray-300">
        <MapContainer
          center={pos || DEFAULT_CENTER}
          zoom={pos ? 14 : 4}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCapture onPick={handlePick} />
          <RecenterOnPos pos={pos} />
          {pos && <Marker position={pos} icon={eventIcon} />}
        </MapContainer>
      </div>

      <div className="mt-2 flex items-start gap-2 text-sm">
        <MapPin size={16} className="text-[#FF6D2C] shrink-0 mt-0.5" />
        {pos ? (
          <div className="text-[#1E1E1E]/70">
            {loadingAddr
              ? "Buscando endereço..."
              : address || "Endereço não identificado"}
            <span className="block text-xs text-[#1E1E1E]/40">
              {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
            </span>
          </div>
        ) : (
          <span className="text-[#1E1E1E]/50">
            Busque pelo nome do local acima ou clique no mapa para marcar.
          </span>
        )}
      </div>
    </div>
  );
}
