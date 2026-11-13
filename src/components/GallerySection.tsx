import React from "react";
import { Trash2, Expand } from "lucide-react";

export interface SavedArtwork {
  id: string;
  accessionNumber: string;
  title: string;
  movementName: string;
  movementEra: string;
  exponents: string;
  dataUrl: string;
  curatorialNote: string;
  palette: [string, string, string, string, string];
  isAiAdapted: boolean;
  createdAt: string;
}

interface GallerySectionProps {
  items: SavedArtwork[];
  onInspect: (item: SavedArtwork) => void;
  onRemove: (id: string) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  items,
  onInspect,
  onRemove,
}) => {
  return (
    <section id="galeria" className="py-16 lg:py-20 border-t border-[#E6E6E2]">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
              Colección personal
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#0A0A0A]">
              Galería de obras guardadas
            </h2>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#6B6B68]">
            {items.length} {items.length === 1 ? "pieza catalogada" : "piezas catalogadas"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-[#D6D6D1] rounded-xl p-10 text-center bg-[#F7F7F5]">
            <p className="font-serif text-xl text-[#0A0A0A]">
              Tu archivo de galería está vacío
            </p>
            <p className="text-sm text-[#52524E] mt-1.5 max-w-md mx-auto">
              Transforma cualquier fotografía en el estudio superior y pulsa{" "}
              <span className="font-medium text-[#0A0A0A]">Guardar en galería</span> para conservar
              su ficha curatorial y descarga en alta resolución.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {items.map((item) => (
              <article
                key={item.id}
                className="bg-white border border-[#E6E6E2] rounded-xl overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-[#F7F7F5] p-4 flex items-center justify-center border-b border-[#E6E6E2]">
                  <img
                    src={item.dataUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => onInspect(item)}
                    aria-label={`Inspeccionar ${item.title}`}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/95 border border-[#E6E6E2] text-[#0A0A0A] hover:border-[#0A0A0A] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Expand className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-mono tabular-nums text-[#6B6B68]">
                      {item.accessionNumber} · {item.isAiAdapted ? "Adaptación IA" : "Preconfigurado"}
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-[#0A0A0A] mt-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#52524E] mt-1">
                      {item.movementName} · {item.movementEra}
                    </p>
                    <p className="text-xs text-[#3F3F3C] leading-relaxed mt-3 line-clamp-2">
                      {item.curatorialNote}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E6E6E2] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onInspect(item)}
                      className="text-xs font-medium text-[#1E3A8A] hover:underline underline-offset-4 cursor-pointer"
                    >
                      Ver ficha de museo
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Eliminar ${item.title}`}
                      className="text-xs text-[#6B6B68] hover:text-[#991B1B] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Retirar</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
