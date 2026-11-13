import React, { useEffect } from "react";
import { X, Download } from "lucide-react";
import { SavedArtwork } from "./GallerySection";

interface ArtworkLightboxProps {
  artwork: SavedArtwork | null;
  onClose: () => void;
}

export const ArtworkLightbox: React.FC<ArtworkLightboxProps> = ({ artwork, onClose }) => {
  useEffect(() => {
    if (!artwork) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [artwork, onClose]);

  if (!artwork) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = artwork.dataUrl;
    link.download = `${artwork.accessionNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl border border-[#E6E6E2] max-w-5xl w-full max-h-[92vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-[1.25fr_1fr]"
      >
        <div className="bg-[#F7F7F5] p-6 sm:p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#E6E6E2]">
          <img
            src={artwork.dataUrl}
            alt={artwork.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[70vh] object-contain shadow-sm bg-white border border-[#E6E6E2]"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[#6B6B68]">
                  {artwork.accessionNumber}
                </p>
                <h2
                  id="lightbox-title"
                  className="font-serif text-3xl font-semibold text-[#0A0A0A] mt-1"
                >
                  {artwork.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha de museo"
                className="w-9 h-9 rounded-lg border border-[#E6E6E2] hover:border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Museum Accession Definition List */}
            <dl className="mt-6 divide-y divide-[#E6E6E2] border-y border-[#E6E6E2] text-sm">
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#6B6B68]">Movimiento</dt>
                <dd className="font-medium text-[#0A0A0A] text-right">{artwork.movementName}</dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#6B6B68]">Periodo y referentes</dt>
                <dd className="text-[#292524] text-right">
                  {artwork.movementEra} · {artwork.exponents}
                </dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#6B6B68]">Procedencia técnica</dt>
                <dd className="text-[#292524] text-right">
                  {artwork.isAiAdapted
                    ? "Adaptación cromática con IA + síntesis canvas"
                    : "Filtro procedural preconfigurado"}
                </dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-[#6B6B68]">Fecha de registro</dt>
                <dd className="font-mono text-xs text-[#292524] tabular-nums">{artwork.createdAt}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
                Comentario curatorial
              </p>
              <p className="text-sm leading-relaxed text-[#292524]">{artwork.curatorialNote}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
                Registro de pigmentos
              </p>
              <div className="flex items-center gap-2">
                {artwork.palette.map((hex, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span
                      style={{ backgroundColor: hex }}
                      className="w-8 h-8 rounded-md border border-black/10 block"
                    />
                    <span className="font-mono text-[10px] text-[#6B6B68]">
                      {hex.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0A0A0A] hover:bg-[#262624] rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Descargar obra en PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
