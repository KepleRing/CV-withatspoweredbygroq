// components/SideAd.tsx
export default function SideAd({ type = "ad" }: { type?: "ad" | "recommended" }) {
  return (
    <div className="sticky top-10">
      <section className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur w-[240px]">
        <h3 className="text-xs font-semibold text-slate-300 mb-2">
          {type === "ad" ? "Publicidad" : "Recomendado"}
        </h3>

        <div className="h-64 bg-slate-800/30 rounded-xl border border-slate-700/30 flex items-center justify-center text-slate-500 text-xs">
          {type === "ad" ? "Espacio de anuncio" : "Afiliado / curso"}
        </div>
      </section>
    </div>
  );
}
