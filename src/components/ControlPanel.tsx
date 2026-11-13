import React from "react";
import { Sparkles, RotateCcw, Upload } from "lucide-react";
import { ART_MOVEMENTS, ArtMovement, FilterParams, MovementAlgorithm } from "../data/movements";

export type PresetLevel = "sutil" | "canonico" | "vanguardia" | "personalizado";

interface ControlPanelProps {
  activeMovement: ArtMovement;
  onSelectMovement: (id: MovementAlgorithm) => void;
  params: FilterParams;
  onChangeParams: (next: FilterParams) => void;
  presetLevel: PresetLevel;
  onSelectPreset: (level: "sutil" | "canonico" | "vanguardia") => void;
  onResetMovement: () => void;
  onAdaptWithAi: () => void;
  isAdaptingAi: boolean;
  aiError: string | null;
  onTriggerUpload: () => void;
}

const SLIDER_SPECS: Array<{
  key: keyof FilterParams;
  label: string;
  min: number;
  max: number;
  unit?: string;
}> = [
  { key: "intensity", label: "Intensidad estilística", min: 20, max: 100, unit: "%" },
  { key: "brushScale", label: "Escala de trazo / grano", min: 15, max: 100, unit: "px" },
  { key: "contrast", label: "Contraste tonal", min: 20, max: 100, unit: "%" },
  { key: "saturation", label: "Saturación de pigmento", min: 10, max: 100, unit: "%" },
  { key: "lineWeight", label: "Contorno gráfico", min: 0, max: 100, unit: "%" },
  { key: "warmth", label: "Temperatura cromática", min: -50, max: 50, unit: "" },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  activeMovement,
  onSelectMovement,
  params,
  onChangeParams,
  presetLevel,
  onSelectPreset,
  onResetMovement,
  onAdaptWithAi,
  isAdaptingAi,
  aiError,
  onTriggerUpload,
}) => {
  return (
    <aside className="bg-[#F7F7F5] border border-[#E6E6E2] rounded-xl p-6 flex flex-col gap-7">
      {/* AI Adaptation Block */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-serif text-xl font-semibold text-[#0A0A0A]">
            Dirección artística con IA
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-[#52524E] mb-4">
          La inteligencia artificial analiza la luz, los rasgos y los tonos de tu fotografía para
          calibrar la paleta y los trazos de{" "}
          <span className="font-medium text-[#0A0A0A]">{activeMovement.name}</span>.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onAdaptWithAi}
            disabled={isAdaptingAi}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#172B6B] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isAdaptingAi ? "Analizando fotografía..." : "Adaptar foto con IA"}</span>
          </button>

          <button
            type="button"
            onClick={onTriggerUpload}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#0A0A0A] bg-white border border-[#D6D6D1] hover:border-[#0A0A0A] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Subir otra fotografía</span>
          </button>
        </div>

        {aiError && (
          <div
            role="alert"
            className="mt-3 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] leading-relaxed"
          >
            {aiError}
          </div>
        )}
      </div>

      <hr className="border-[#E6E6E2]" />

      {/* Art Movement Selector */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-serif text-lg font-semibold text-[#0A0A0A]">
            Movimiento artístico
          </h3>
          <span className="text-xs text-[#6B6B68] font-mono tabular-nums">
            {ART_MOVEMENTS.length} estilos
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 max-h-[290px] overflow-y-auto pr-1">
          {ART_MOVEMENTS.map((mov) => {
            const isActive = mov.id === activeMovement.id;
            return (
              <button
                key={mov.id}
                type="button"
                onClick={() => onSelectMovement(mov.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                  isActive
                    ? "bg-white border-[#1E3A8A] text-[#0A0A0A]"
                    : "bg-transparent border-transparent hover:bg-white/70 hover:border-[#E6E6E2] text-[#292524]"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{mov.name}</span>
                  </div>
                  <p className="text-[11px] text-[#6B6B68] truncate mt-0.5">
                    {mov.era} · {mov.exponents}
                  </p>
                </div>

                {/* Mini 4-swatch pigment bar */}
                <div className="flex items-center shrink-0 border border-black/10 rounded overflow-hidden">
                  {mov.palette.slice(0, 4).map((hex, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: hex }}
                      className="w-2.5 h-5 block"
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-[#E6E6E2]" />

      {/* Preconfigured Filter Presets & Fine Controls */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-serif text-lg font-semibold text-[#0A0A0A]">
            Filtros preconfigurados
          </h3>
          <button
            type="button"
            onClick={onResetMovement}
            className="inline-flex items-center gap-1 text-xs text-[#52524E] hover:text-[#0A0A0A] transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* 3 Preset Intensity Tabs */}
        <div
          role="group"
          aria-label="Intensidad preconfigurada"
          className="grid grid-cols-3 gap-1 p-1 bg-[#EBEBE6] rounded-lg mb-5"
        >
          {(
            [
              { id: "sutil", label: "Sutil" },
              { id: "canonico", label: "Canónico" },
              { id: "vanguardia", label: "Vanguardia" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                presetLevel === preset.id
                  ? "bg-white text-[#0A0A0A] shadow-xs"
                  : "text-[#52524E] hover:text-[#0A0A0A]"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Parameter Sliders */}
        <div className="flex flex-col gap-4">
          {SLIDER_SPECS.map((spec) => {
            const val = params[spec.key];
            return (
              <div key={spec.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor={`slider-${spec.key}`} className="text-[#292524] font-medium">
                    {spec.label}
                  </label>
                  <span className="font-mono tabular-nums text-[#52524E]">
                    {spec.key === "warmth" && val > 0 ? `+${val}` : val}
                    {spec.unit}
                  </span>
                </div>
                <input
                  id={`slider-${spec.key}`}
                  type="range"
                  min={spec.min}
                  max={spec.max}
                  value={val}
                  onChange={(e) =>
                    onChangeParams({
                      ...params,
                      [spec.key]: Number(e.target.value),
                    })
                  }
                  className="studio-slider w-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
