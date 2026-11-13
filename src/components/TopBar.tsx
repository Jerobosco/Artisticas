import React from "react";
import { Upload } from "lucide-react";

interface TopBarProps {
  onTriggerUpload: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onTriggerUpload }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E6E6E2]">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#estudio"
          className="font-serif text-2xl font-semibold tracking-tight text-[#0A0A0A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1E3A8A] focus-visible:outline-offset-4"
        >
          Atelier Cromático
        </a>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52524E]"
        >
          <a
            href="#estudio"
            className="hover:text-[#0A0A0A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Estudio
          </a>
          <a
            href="#movimientos"
            className="hover:text-[#0A0A0A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Movimientos
          </a>
          <a
            href="#comparativa"
            className="hover:text-[#0A0A0A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Comparativa
          </a>
          <a
            href="#galeria"
            className="hover:text-[#0A0A0A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Galería
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#172B6B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1E3A8A] focus-visible:outline-offset-2"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Cargar fotografía</span>
          </button>
        </div>
      </div>
    </header>
  );
};
