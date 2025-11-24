"use client";

interface SummaryCardProps {
  score: number | null;
  atsText?: string;
}

export default function SummaryCard({ score, atsText }: SummaryCardProps) {
  if (score === null) return null;

  const safeText = atsText ?? "";

  // Extraer palabras faltantes (máximo 3)
  const keywords = safeText
    .split("\n")
    .filter((l) =>
      ["azure", "power", "intune", "sql", "sharepoint"].some((kw) =>
        l.toLowerCase().includes(kw)
      )
    )
    .slice(0, 3)
    .map((t) => t.replace(/[-•]/g, "").trim());

const level =
  score >= 80
    ? "Excelente"
    : score >= 60
    ? "Aceptable"
    : score >= 40
    ? "Débil"
    : "Crítico";


const levelColor =
  score >= 80
    ? "text-emerald-400"
    : score >= 60
    ? "text-sky-300"
    : score >= 40
    ? "text-amber-400"
    : "text-rose-400";


  return (
    <div className="mb-6 bg-slate-800/60 p-5 rounded-xl border border-white/10 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sky-300">Resumen rápido</h3>

        <div className="text-right">
          <p className="text-sm text-slate-300">Score ATS</p>
          <p className={`text-3xl font-bold ${levelColor}`}>{score}/100</p>

          <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300 border border-white/10">
            Escala 0–100
          </span>
        </div>
      </div>

      <p className={`mt-2 text-sm font-medium ${levelColor}`}>
        Estado general: {level}
      </p>

      <div className="mt-4">
        <p className="text-xs text-slate-400 mb-1">
          Palabras clave importantes faltantes:
        </p>
        <ul className="text-sm text-slate-200 space-y-1 list-disc list-inside">
          {keywords.length > 0 ? (
            keywords.map((k, i) => <li key={i}>{k}</li>)
          ) : (
            <li>No se detectaron palabras clave importantes faltantes.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
