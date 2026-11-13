import React, { useEffect, useRef, useState } from "react";
import { ART_MOVEMENTS, MovementAlgorithm } from "../data/movements";
import { renderArtisticCanvas } from "../lib/artEngine";

interface ComparisonSheetProps {
  sourceImage: HTMLImageElement | null;
  onSelectMovement: (id: MovementAlgorithm) => void;
}

const QUARTETS: Record<"vanguardias" | "clasicos", MovementAlgorithm[]> = {
  vanguardias: ["postimpressionism", "cubism", "popart", "topographic_ink"],
  clasicos: ["impressionism", "chiaroscuro", "ukiyoe", "pointillism"],
};

export const ComparisonSheet: React.FC<ComparisonSheetProps> = ({
  sourceImage,
  onSelectMovement,
}) => {
  const [group, setGroup] = useState<"vanguardias" | "clasicos">("vanguardias");
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const activeIds = QUARTETS[group];

  useEffect(() => {
    if (!sourceImage) return;
    const raf = requestAnimationFrame(() => {
      for (const id of activeIds) {
        const canvas = canvasRefs.current[id];
        const mov = ART_MOVEMENTS.find((m) => m.id === id);
        if (canvas && mov) {
          renderArtisticCanvas(sourceImage, canvas, {
            algorithm: mov.id,
            params: mov.defaultParams,
            palette: mov.palette,
            maxDimension: 440,
          });
        }
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [sourceImage, activeIds]);

  return (
    <section id="comparativa" className="py-16 lg:py-20 bg-[#F7F7F5] border-t border-[#E6E6E2]">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
              Hoja de contacto simultánea
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#0A0A0A] text-balance">
              Comparativa directa sobre tu fotografía activa
            </h2>
          </div>

          <div
            role="group"
            aria-label="Conjunto de movimientos a comparar"
            className="inline-flex items-center p-1 bg-[#EBEBE6] rounded-lg"
          >
            <button
              type="button"
              onClick={() => setGroup("vanguardias")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                group === "vanguardias"
                  ? "bg-white text-[#0A0A0A] shadow-xs"
                  : "text-[#52524E] hover:text-[#0A0A0A]"
              }`}
            >
              Vanguardias y Gráfica
            </button>
            <button
              type="button"
              onClick={() => setGroup("clasicos")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                group === "clasicos"
                  ? "bg-white text-[#0A0A0A] shadow-xs"
                  : "text-[#52524E] hover:text-[#0A0A0A]"
              }`}
            >
              Luz, Color y Xilografía
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeIds.map((id) => {
            const mov = ART_MOVEMENTS.find((m) => m.id === id);
            if (!mov) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectMovement(id)}
                className="group text-left bg-white border border-[#E6E6E2] hover:border-[#1E3A8A] rounded-xl p-3.5 transition-colors flex flex-col cursor-pointer"
              >
                <div className="aspect-[4/5] w-full bg-[#F2F2EE] rounded-lg overflow-hidden flex items-center justify-center mb-3.5">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[id] = el;
                    }}
                    className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg font-semibold text-[#0A0A0A] group-hover:text-[#1E3A8A] transition-colors">
                    {mov.name}
                  </h3>
                  <span className="text-[11px] font-mono text-[#6B6B68] shrink-0">{mov.era}</span>
                </div>
                <p className="text-xs text-[#52524E] mt-1">{mov.shortTag}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
