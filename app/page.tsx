"use client";
import SideAd from "@/components/SideAd";
import SummaryCard from "@/components/SummaryCard";
import { useState } from "react";
import {
  ArrowUpTrayIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

type TabKey = "analysis" | "ats" | "original";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("ats");

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setOutput("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/process", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setOutput(data.output || "Hubo un problema al analizar tu CV.");
    setLoading(false);
    setActiveTab("ats");
  };

  const hasFile = !!file;

  // ---- Parsear salida en secciones: CV ORIGINAL / ANÁLISIS / ATS ----
  let cvOriginal = "";
  let analysis = "";
  let ats = "";
  let atsScore: number | null = null;
  let missingKeywords: string[] = []; // (por si luego lo usamos)

  if (output && !loading && output.length > 20) {
    const cvMarker = "=== CV ORIGINAL";
    const analysisMarker = "=== ANÁLISIS PROFESIONAL";
    const atsMarker = "=== OPTIMIZACIÓN ATS";

    const idxCv = output.indexOf(cvMarker);
    const idxAnalysis = output.indexOf(analysisMarker);
    const idxAts = output.indexOf(atsMarker);

    if (idxCv !== -1 && idxAnalysis !== -1) {
      cvOriginal = output
        .slice(idxCv + cvMarker.length, idxAnalysis)
        .replace(/=== TEXTO EXTRA[IÍ]DO ===/gi, "")
        .trim();
    }

    if (idxAnalysis !== -1 && idxAts !== -1) {
      analysis = output
        .slice(idxAnalysis + analysisMarker.length, idxAts)
        .trim();
    }

    if (idxAts !== -1) {
      ats = output.slice(idxAts + atsMarker.length).trim();
    }

    // ❌ ESTE ERA EL QUE ROMPÍA TODO → LO QUITAMOS
    // if (!analysis && !ats) {
    //   analysis = output;
    // }

    // --- EXTRAER SCORE ATS ---
    const scoreSource = ats || analysis || output;
    let boldMatch = scoreSource.match(/\*\*(\d{1,3})\*\*/);

    if (boldMatch) {
      const num = Number(boldMatch[1]);
      if (!Number.isNaN(num)) atsScore = Math.max(0, Math.min(100, num));
    } else {
      const lower = scoreSource.toLowerCase();
      const anchor = "score estimado ats";
      const idxAnchor = lower.indexOf(anchor);

      if (idxAnchor !== -1) {
        const after = scoreSource.slice(idxAnchor);
        const nums = after.match(/\d{1,3}/g);
        if (nums) {
          const candidate = nums.map(Number).find((n) => n > 0 && n < 100);
          if (candidate !== undefined) atsScore = candidate;
        }
      }
    }

    // --- EXTRAER PALABRAS CLAVE FALTANTES REALES ---
    const keywordBlockMatch = ats.match(
      /Palabras clave.*?:([\s\S]*?)(Score|$)/i
    );

    if (keywordBlockMatch) {
      missingKeywords = keywordBlockMatch[1]
        .split("\n")
        .map((l) => l.replace(/[-•]/g, "").trim())
        .filter((l) => l.length > 0);
    }
  }

  const renderActiveTabContent = () => {
    if (!output) return null;

    if (activeTab === "analysis") {
      // 🔥 YA NO METEMOS TODO EL OUTPUT AQUÍ
      if (!analysis) {
        return (
          <div className="whitespace-pre-wrap leading-relaxed text-slate-100 text-sm md:text-base">
            No se pudo separar el análisis de forma clara. Revisa la pestaña de
            Optimización ATS o intenta volver a subir tu CV.
          </div>
        );
      }

      return (
        <div className="whitespace-pre-wrap leading-relaxed text-slate-100 text-sm md:text-base">
          {analysis}
        </div>
      );
    }

    if (activeTab === "ats") {
      const message =
        atsScore === null
          ? ""
          : atsScore >= 75
          ? "Tu CV tiene buen desempeño frente a ATS; solo afina detalles finos de palabras clave y formato."
          : atsScore >= 50
          ? "Tu CV es aceptable, pero hay margen de mejora en palabras clave, jerarquía de información y claridad."
          : "Tu CV probablemente tenga problemas con ATS; es recomendable aplicar varias de las mejoras sugeridas.";

      const barColor =
        atsScore === null
          ? "bg-slate-600"
          : atsScore >= 75
          ? "bg-emerald-400"
          : atsScore >= 50
          ? "bg-amber-400"
          : "bg-rose-500";

      return (
        <div className="space-y-4">
          {atsScore !== null && (
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Score ATS estimado</span>
                <span>{atsScore}/100</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500`}
                  style={{ width: `${atsScore}%` }}
                />
              </div>
              {message && (
                <p className="mt-2 text-xs text-slate-400">{message}</p>
              )}
            </div>
          )}

          <div className="whitespace-pre-wrap leading-relaxed text-slate-100 text-sm md:text-base">
            {ats ||
              "No se encontraron detalles ATS específicos. Revisa el análisis general para más contexto."}
          </div>
        </div>
      );
    }

    // CV original
    return (
      <div className="whitespace-pre-wrap leading-relaxed text-slate-100 text-sm md:text-base">
        {cvOriginal || "No se pudo mostrar el texto original del CV."}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-white">
      <div className="w-full max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_260px] gap-6">
        {/* LEFT AD */}
        <div className="hidden lg:block">
          <div className="sticky top-10 flex flex-col gap-4">
            <SideAd type="ad" />
            <SideAd type="recommended" />
          </div>
        </div>

        {/* CONTENIDO CENTRAL */}
        <div className="flex flex-col items-center">
          {/* HERO */}
          <section className="w-full flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <p className="uppercase tracking-[0.3em] text-xs text-sky-300/80 mb-3">
                CV REVIEW • ATS • DATA-DRIVEN
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Convierte tu{" "}
                <span className="text-sky-300">CV</span> en una{" "}
                <span className="text-sky-400">herramienta de selección</span>.
              </h1>
              <p className="mt-4 text-slate-200/80 text-sm md:text-base">
                Sube tu CV en PDF y recibe un análisis profesional: qué está
                bien, qué está mal y cómo se comporta frente a sistemas ATS
                usados por miles de empresas.
              </p>
            </div>

            {/* Imagen ilustrativa */}
            <div className="flex-1 flex justify-center">
              <img
                src="https://images.pexels.com/photos/6804069/pexels-photo-6804069.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Persona mejorando su CV en una laptop"
                className="rounded-3xl shadow-2xl border border-white/10 max-h-72 object-cover"
              />
            </div>
          </section>

          {/* CARD DE SUBIDA */}
          <section className="w-full max-w-3xl mt-10 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-sky-300" />
              Analiza tu CV
            </h2>

            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition
          ${
            hasFile
              ? "border-emerald-400 bg-emerald-950/30"
              : "border-sky-500/40 bg-slate-900/40 hover:border-sky-300"
          }`}
            >
              {hasFile ? (
                <CheckCircleIcon className="w-10 h-10 text-emerald-400" />
              ) : (
                <ArrowUpTrayIcon className="w-10 h-10 text-sky-300" />
              )}

              <p className="mt-3 text-slate-100 text-center">
                {hasFile
                  ? `Archivo seleccionado: ${file?.name}`
                  : "Arrastra tu CV en PDF o haz clic para seleccionar"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recomendado: máximo 2–3 páginas, formato simple.
              </p>

              {hasFile && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/50 px-3 py-1 text-xs text-emerald-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  Archivo listo para analizar
                </span>
              )}

              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="mt-6 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2
                     bg-sky-500 hover:bg-sky-600 disabled:bg-slate-500/50 disabled:cursor-not-allowed
                     transition"
            >
              <SparklesIcon className="w-5 h-5" />
              {loading ? "Analizando tu CV..." : "Analizar CV"}
            </button>

            <p className="mt-3 text-xs text-slate-400">
              No almacenamos tus archivos. El análisis se realiza en tiempo real
              y el contenido se descarta después del procesamiento.
            </p>
          </section>

          {/* SALIDA */}
          {loading && (
            <div className="mt-8 text-sky-200 animate-pulse text-sm">
              Estamos leyendo tu CV y generando un análisis detallado...
            </div>
          )}

          {output && !loading && (
            <section className="w-full max-w-4xl mt-10 bg-slate-900/60 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur">
              <h2 className="text-lg md:text-xl font-semibold text-sky-300 mb-4">
                Resultado del análisis
              </h2>

              <SummaryCard score={atsScore} atsText={ats ?? ""} />

              {/* Tabs */}
              <div className="flex gap-2 border-b border-white/10 mb-4 text-sm">
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={`px-3 py-2 rounded-t-lg ${
                    activeTab === "analysis"
                      ? "bg-sky-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Análisis
                </button>
                <button
                  onClick={() => setActiveTab("ats")}
                  className={`px-3 py-2 rounded-t-lg ${
                    activeTab === "ats"
                      ? "bg-sky-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Optimización ATS
                </button>
                <button
                  onClick={() => setActiveTab("original")}
                  className={`px-3 py-2 rounded-t-lg ${
                    activeTab === "original"
                      ? "bg-sky-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  CV original
                </button>
              </div>

              {/* Contenido de la pestaña activa */}
              {renderActiveTabContent()}
            </section>
          )}

          {/* FOOTER */}
          <footer className="mt-16 text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} Kepler Resume Analyzer · Próximamente:
            comparación con bases ATS, soporte dedicado y panel de usuario.
          </footer>
        </div>

        {/* RIGHT AD */}
        <div className="hidden lg:block">
          <div className="sticky top-10 flex flex-col gap-4">
            <SideAd type="ad" />
            <SideAd type="recommended" />
          </div>
        </div>
      </div>
    </main>
  );
}
