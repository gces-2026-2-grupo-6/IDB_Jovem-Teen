import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, EyeOff, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import loginBg from "../../assets/images/login_background.png";
import { BorderBeam } from "../../components/ui/border-beam";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ usuario: "", senha: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(form.usuario, form.senha);
    setLoading(false);
    if (result.success) {
      navigate(result.rotaInicial || "/admin");
    } else {
      setError(result.error);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center relative pt-[70px] md:pt-[82px]"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      <div className="absolute inset-0 bg-black/20" />

      <form
        onSubmit={handleSubmit}
        className="
          relative overflow-hidden z-10
          w-[90%] max-w-[480px]
          rounded-2xl
          border border-white/20
          px-10 py-12
          flex flex-col items-center gap-8
        "
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Título */}
        <h1 className="text-white font-bold text-2xl md:text-3xl tracking-tight">
          Faça o seu login
        </h1>

        {/* Erro */}
        {error && (
          <div className="w-full bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-red-200 text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Campo Usuário */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-white font-bold text-sm">Seu usuário:</label>
          <div className="flex items-center gap-3 bg-white/90 rounded-full px-5 h-[52px]">
            <User size={20} className="text-[#6B6B6B] shrink-0" />
            <input
              type="text"
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#1E1E1E] placeholder:text-[#A0A0A0]"
              placeholder="Digite seu usuário"
            />
          </div>
        </div>

        {/* Campo Senha */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-white font-bold text-sm">Sua senha:</label>
          <div className="flex items-center gap-3 bg-white/90 rounded-full px-5 h-[52px]">
            <Lock size={20} className="text-[#6B6B6B] shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              name="senha"
              value={form.senha}
              onChange={handleChange}
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#1E1E1E] placeholder:text-[#A0A0A0]"
              placeholder="Digite sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#6B6B6B] hover:text-[#1E1E1E] transition-colors shrink-0"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        {/* Botão Login */}
        <button
          type="submit"
          disabled={loading}
          className="
            bg-white hover:bg-white/90
            text-[#FF6D2C] font-bold
            text-lg
            rounded-full
            px-12 py-3
            shadow-lg
            transition-all duration-300
            hover:shadow-xl hover:scale-[1.02]
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
          "
        >
          {loading ? "Entrando..." : "Login"}
        </button>
        <BorderBeam duration={8} size={100} />
      </form>
    </main>
  );
}
