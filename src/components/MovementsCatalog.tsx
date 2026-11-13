import React from "react";
import { ArrowUpRight } from "lucide-react";
import { ART_MOVEMENTS, MovementAlgorithm } from "../data/movements";

interface MovementsCatalogProps {
  activeMovementId: MovementAlgorithm;
  onApplyMovement: (id: MovementAlgorithm) => void;
}

export const MovementsCatalog: React.FC<MovementsCatalogProps> = ({
  activeMovementId,
  onApplyMovement,
}) => {
  return (
    <section id="movimientos" className="py-16 lg:py-20 border-t border-[#E6E6E2]">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
            Archivo histórico de estilos
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#0A0A0A] text-balance">
            Diez movimientos artísticos listos para reinterpretar tu fotografía
          </h2>
          <p className="text-sm text-[#52524E] leading-relaxed mt-3">
            Cada movimiento implementa un algoritmo propio de síntesis pictórica —desde pinceladas
            direccionales guiadas por gradientes hasta teselación cubista, retículas Ben-Day y
            curvas topográficas en tinta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {ART_MOVEMENTS.map((mov, index) => {
            const isActive = mov.id === activeMovementId;
            return (
              <article
                key={mov.id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-colors ${
                  isActive
                    ? "bg-[#F7F7F5] border-[#1E3A8A]"
                    : "bg-white border-[#E6E6E2] hover:border-[#A8A8A2]"
                }`}
              >
                <div>
                  {/* Color Pigment Bar */}
                  <div className="h-2.5 w-full rounded-sm overflow-hidden flex mb-4 border border-black/10">
                    {mov.palette.map((hex, i) => (
                      <span key={i} style={{ backgroundColor: hex }} className="flex-1 h-full" />
                    ))}
                  </div>

                  <p className="text-[11px] font-mono tabular-nums text-[#6B6B68]">
                    {String(index + 1).padStart(2, "0")}. {mov.era}
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-[#0A0A0A] mt-1">
                    {mov.name}
                  </h3>
                  <p className="text-xs text-[#52524E] mt-1">{mov.exponents}</p>
                  <p className="text-xs text-[#3F3F3C] leading-relaxed mt-3">{mov.shortTag}.</p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E6E6E2]">
                  <button
                    type="button"
                    onClick={() => onApplyMovement(mov.id)}
                    className={`w-full inline-flex items-center justify-between text-xs font-medium cursor-pointer transition-colors ${
                      isActive ? "text-[#1E3A8A]" : "text-[#0A0A0A] hover:text-[#1E3A8A]"
                    }`}
                  >
                    <span>{isActive ? "Activo en estudio" : "Aplicar al lienzo"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
