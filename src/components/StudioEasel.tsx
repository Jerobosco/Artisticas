import React, { useRef, useState } from "react";
import { Download, BookmarkPlus, Upload, Check, MoveHorizontal } from "lucide-react";
import { ArtMovement, SAMPLE_SOURCES } from "../data/movements";

export type ViewMode = "artwork" | "compare" | "original";

export interface AiAdaptationResult {
  suggestedTitle: string;
  curatorialNote: string;
  customPalette?: [string, string, string, string, string];
}

interface StudioEaselProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sourceUrl: string;
  sourceLabel: string;
  activeMovement: ArtMovement;
  activePalette: [string, string, string, string, string];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onSelectSample: (url: string, label: string) => void;
  onFileUpload: (file: File) => void;
  onDownload: () => void;
  onSaveToGallery: () => void;
  justSaved: boolean;
  isRendering: boolean;
  isAdaptingAi: boolean;
  aiResult: AiAdaptationResult | null;
  dimensions: { width: number; height: number };
}

export const StudioEasel: React.FC<StudioEaselProps> = ({
  canvasRef,
  sourceUrl,
  sourceLabel,
  activeMovement,
  activePalette,
  viewMode,
  onChangeViewMode,
  onSelectSample,
  onFileUpload,
  onDownload,
  onSaveToGallery,
  justSaved,
  isRendering,
  isAdaptingAi,
  aiResult,
  dimensions,
}) => {
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [sourceImageError, setSourceImageError] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileUpload(file);
    }
  };

  const updateSplitFromPointer = (clientX: number) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.max(5, Math.min(95, pct)));
  };

  return (
    <div className="flex flex-col">
      {/* Studio Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6E6E2]">
        <div
          role="group"
          aria-label="Modo de visualización"
          className="inline-flex items-center p-1 bg-[#F2F2EE] rounded-lg"
        >
          {(
            [
              { id: "artwork", label: "Obra" },
              { id: "compare", label: "Comparar" },
              { id: "original", label: "Original" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangeViewMode(mode.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === mode.id
                  ? "bg-white text-[#0A0A0A] shadow-xs"
                  : "text-[#52524E] hover:text-[#0A0A0A]"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#6B6B68] mr-1">Obras base:</span>
          {SAMPLE_SOURCES.map((sample) => {
            const isSelected = sourceUrl === sample.url;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setSourceImageError(false);
                  onSelectSample(sample.url, sample.title);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                    : "bg-white text-[#3F3F3C] border-[#E6E6E2] hover:border-[#0A0A0A]"
                }`}
              >
                {sample.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dominant Gallery Canvas Mat */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative mt-5 bg-[#F7F7F5] border transition-colors rounded-xl p-5 sm:p-8 flex items-center justify-center min-h-[460px] lg:min-h-[580px] ${
          isDraggingFile ? "border-[#1E3A8A] bg-[#EFF4FF]" : "border-[#E6E6E2]"
        }`}
      >
        <div
          ref={frameRef}
          className="relative max-w-full max-h-[620px] flex items-center justify-center select-none overflow-hidden shadow-sm bg-white border border-[#E6E6E2]"
        >
          {/* Rendered Movement Canvas (always mounted so ref stays valid) */}
          <canvas
            ref={canvasRef}
            className={`block max-w-full max-h-[600px] w-auto h-auto object-contain transition-opacity duration-150 ${
              viewMode === "original" ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />

          {/* Original Image Overlay for "Original" or Split "Comparar" */}
          {!sourceImageError ? (
            <img
              src={sourceUrl}
              alt={sourceLabel}
              referrerPolicy="no-referrer"
              onError={() => setSourceImageError(true)}
              style={
                viewMode === "compare"
                  ? { clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }
                  : undefined
              }
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150 ${
                viewMode === "artwork" ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : (
            viewMode === "original" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F2F2EE] text-[#52524E] p-6 text-center">
                <Upload className="w-7 h-7 mb-2 text-[#6B6B68]" />
                <p className="text-sm font-medium">{sourceLabel}</p>
              </div>
            )
          )}

          {/* Split Curtain Handle in Compare Mode */}
          {viewMode === "compare" && (
            <>
              <div
                style={{ left: `${splitPercent}%` }}
                className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.35)] pointer-events-none"
              />
              <div
                style={{ left: `${splitPercent}%` }}
                onPointerDown={(e) => {
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  updateSplitFromPointer(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (e.buttons === 1) {
                    updateSplitFromPointer(e.clientX);
                  }
                }}
                role="slider"
                aria-label="Deslizador de comparación entre original y obra estilizada"
                aria-valuemin={5}
                aria-valuemax={95}
                aria-valuenow={Math.round(splitPercent)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") setSplitPercent((p) => Math.max(5, p - 4));
                  if (e.key === "ArrowRight") setSplitPercent((p) => Math.min(95, p + 4));
                }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-md cursor-ew-resize hover:bg-[#1E3A8A] transition-colors"
              >
                <MoveHorizontal className="w-4 h-4" />
              </div>
              <span className="absolute top-3 left-3 px-2 py-1 text-[11px] font-medium bg-[#0A0A0A]/80 text-white rounded">
                Original
              </span>
              <span className="absolute top-3 right-3 px-2 py-1 text-[11px] font-medium bg-[#0A0A0A]/80 text-white rounded">
                {activeMovement.name}
              </span>
            </>
          )}

          {/* Processing Overlay */}
          {(isRendering || isAdaptingAi) && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10">
              <div className="w-6 h-6 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-[#0A0A0A]">
                {isAdaptingAi
                  ? "Analizando fotografía y calibrando pigmentos con IA..."
                  : "Sintetizando pinceladas..."}
              </p>
            </div>
          )}
        </div>

        {/* Drag-and-drop prompt */}
        {isDraggingFile && (
          <div className="absolute inset-4 rounded-lg border-2 border-dashed border-[#1E3A8A] bg-white/90 flex flex-col items-center justify-center gap-2 z-20 pointer-events-none">
            <Upload className="w-7 h-7 text-[#1E3A8A]" />
            <p className="text-sm font-medium text-[#0A0A0A]">
              Suelta tu fotografía aquí para adaptarla
            </p>
          </div>
        )}
      </div>

      {/* Museum Accession Caption & Primary Output Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E6E6E2]">
        <div className="min-w-0">
          <p className="font-serif text-xl font-semibold text-[#0A0A0A] truncate">
            {aiResult ? aiResult.suggestedTitle : `${sourceLabel} — ${activeMovement.name}`}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B68] mt-1">
            <span>{activeMovement.name}</span>
            <span aria-hidden="true">·</span>
            <span>{activeMovement.era}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {dimensions.width > 0 ? `${dimensions.width} × ${dimensions.height} px` : "Cargando"}
            </span>
            <span aria-hidden="true">·</span>
            <span>{aiResult ? "Calibrado con IA" : "Filtro preconfigurado"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onSaveToGallery}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#0A0A0A] bg-white border border-[#D6D6D1] hover:border-[#0A0A0A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {justSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
                <span>Guardado en galería</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Guardar en galería</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0A0A0A] hover:bg-[#262624] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Descargar PNG</span>
          </button>
        </div>
      </div>

      {/* Curatorial Note & Harmonized Palette Strip */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-1.5">
            {aiResult ? "Nota curatorial generada por IA" : "Gramática del movimiento"}
          </p>
          <p className="text-sm leading-relaxed text-[#292524] max-w-prose">
            {aiResult ? aiResult.curatorialNote : activeMovement.description}
          </p>
        </div>

        <div className="shrink-0">
          <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
            Paleta de pigmentos
          </p>
          <div className="flex items-center gap-1.5">
            {activePalette.map((hex, i) => (
              <div key={`${hex}-${i}`} className="flex flex-col items-center gap-1">
                <span
                  title={hex}
                  style={{ backgroundColor: hex }}
                  className="w-8 h-8 rounded-md border border-black/10 block"
                />
                <span className="font-mono text-[10px] text-[#6B6B68] tabular-nums">
                  {hex.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
