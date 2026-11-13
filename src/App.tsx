import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ART_MOVEMENTS, FilterParams, MovementAlgorithm, SAMPLE_SOURCES } from "./data/movements";
import { renderArtisticCanvas } from "./lib/artEngine";
import { TopBar } from "./components/TopBar";
import { AiAdaptationResult, StudioEasel, ViewMode } from "./components/StudioEasel";
import { ControlPanel, PresetLevel } from "./components/ControlPanel";
import { MovementsCatalog } from "./components/MovementsCatalog";
import { ComparisonSheet } from "./components/ComparisonSheet";
import { GallerySection, SavedArtwork } from "./components/GallerySection";
import { ArtworkLightbox } from "./components/ArtworkLightbox";

const GALLERY_STORAGE_KEY = "atelier_cromatico_gallery_v1";

function loadSavedGallery(): SavedArtwork[] {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [sourceUrl, setSourceUrl] = useState<string>(SAMPLE_SOURCES[0].url);
  const [sourceLabel, setSourceLabel] = useState<string>(SAMPLE_SOURCES[0].title);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  const [movementId, setMovementId] = useState<MovementAlgorithm>("postimpressionism");
  const activeMovement = useMemo(
    () => ART_MOVEMENTS.find((m) => m.id === movementId) ?? ART_MOVEMENTS[0],
    [movementId]
  );

  const [params, setParams] = useState<FilterParams>(activeMovement.defaultParams);
  const [presetLevel, setPresetLevel] = useState<PresetLevel>("canonico");
  const [viewMode, setViewMode] = useState<ViewMode>("artwork");

  const [aiResult, setAiResult] = useState<AiAdaptationResult | null>(null);
  const [isAdaptingAi, setIsAdaptingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [justSaved, setJustSaved] = useState(false);

  const [gallery, setGallery] = useState<SavedArtwork[]>(loadSavedGallery);
  const [inspectedArtwork, setInspectedArtwork] = useState<SavedArtwork | null>(null);

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Persist gallery safely
  useEffect(() => {
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [gallery]);

  // Load source image into HTMLImageElement
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) {
        setLoadedImage(img);
      }
    };
    img.src = sourceUrl;
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  const activePalette = useMemo(
    () => aiResult?.customPalette ?? activeMovement.palette,
    [aiResult, activeMovement]
  );

  // Render artistic movement onto main canvas whenever image, movement, params, or palette change
  useEffect(() => {
    if (!loadedImage || !mainCanvasRef.current) return;
    setIsRendering(true);
    const timer = window.setTimeout(() => {
      if (!mainCanvasRef.current) return;
      const size = renderArtisticCanvas(loadedImage, mainCanvasRef.current, {
        algorithm: activeMovement.id,
        params,
        palette: activePalette,
        maxDimension: 920,
      });
      setDimensions(size);
      setIsRendering(false);
    }, 16);

    return () => window.clearTimeout(timer);
  }, [loadedImage, activeMovement.id, params, activePalette]);

  const handleSelectMovement = useCallback((id: MovementAlgorithm) => {
    const mov = ART_MOVEMENTS.find((m) => m.id === id);
    if (!mov) return;
    setMovementId(id);
    setParams(mov.defaultParams);
    setPresetLevel("canonico");
    setAiResult(null);
    setAiError(null);
  }, []);

  const handleSelectPreset = useCallback(
    (level: "sutil" | "canonico" | "vanguardia") => {
      setPresetLevel(level);
      setParams(activeMovement.presets[level]);
    },
    [activeMovement]
  );

  const handleChangeParams = useCallback((next: FilterParams) => {
    setParams(next);
    setPresetLevel("personalizado");
  }, []);

  const handleResetMovement = useCallback(() => {
    setParams(activeMovement.defaultParams);
    setPresetLevel("canonico");
    setAiResult(null);
    setAiError(null);
  }, [activeMovement]);

  const handleFileUpload = useCallback((file: File) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    const cleanName = file.name.replace(/\.[^.]+$/, "");
    setSourceUrl(url);
    setSourceLabel(cleanName || "Fotografía cargada");
    setAiResult(null);
    setAiError(null);
    setViewMode("artwork");
  }, []);

  const handleSelectSample = useCallback((url: string, label: string) => {
    setSourceUrl(url);
    setSourceLabel(label);
    setAiResult(null);
    setAiError(null);
  }, []);

  const handleAdaptWithAi = useCallback(async () => {
    if (!loadedImage) return;
    setIsAdaptingAi(true);
    setAiError(null);

    try {
      // Encode downscaled source image (max 640px) for fast multimodal analysis
      const prepCanvas = document.createElement("canvas");
      const natW = loadedImage.naturalWidth || loadedImage.width;
      const natH = loadedImage.naturalHeight || loadedImage.height;
      const scale = Math.min(1, 640 / Math.max(natW, natH));
      prepCanvas.width = Math.max(1, Math.round(natW * scale));
      prepCanvas.height = Math.max(1, Math.round(natH * scale));
      const ctx = prepCanvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar el lienzo de análisis.");
      ctx.drawImage(loadedImage, 0, 0, prepCanvas.width, prepCanvas.height);
      const dataUrl = prepCanvas.toDataURL("image/jpeg", 0.85);

      const response = await fetch("/api/adapt-movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: "image/jpeg",
          movementName: activeMovement.name,
          movementEra: activeMovement.era,
          movementGrammar: activeMovement.grammar,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error al conectar con el servicio de IA.");
      }

      if (payload?.params) {
        setParams(payload.params);
        setPresetLevel("personalizado");
      }
      setAiResult({
        suggestedTitle: payload.suggestedTitle,
        curatorialNote: payload.curatorialNote,
        customPalette: payload.customPalette,
      });
      setViewMode("artwork");
    } catch (err: unknown) {
      setAiError(
        err instanceof Error
          ? err.message
          : "No fue posible analizar la fotografía con inteligencia artificial."
      );
    } finally {
      setIsAdaptingAi(false);
    }
  }, [loadedImage, activeMovement]);

  const handleDownload = useCallback(() => {
    if (!mainCanvasRef.current) return;
    const dataUrl = mainCanvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `atelier-${activeMovement.id}.png`;
    link.click();
  }, [activeMovement.id]);

  const handleSaveToGallery = useCallback(() => {
    if (!mainCanvasRef.current) return;
    const dataUrl = mainCanvasRef.current.toDataURL("image/jpeg", 0.88);
    const now = new Date();
    const acc = `ACC. ${now.getFullYear()}.${String(gallery.length + 1).padStart(3, "0")}`;
    const newEntry: SavedArtwork = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      accessionNumber: acc,
      title: aiResult?.suggestedTitle ?? `${sourceLabel} — ${activeMovement.name}`,
      movementName: activeMovement.name,
      movementEra: activeMovement.era,
      exponents: activeMovement.exponents,
      dataUrl,
      curatorialNote: aiResult?.curatorialNote ?? activeMovement.description,
      palette: activePalette,
      isAiAdapted: Boolean(aiResult),
      createdAt: now.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setGallery((prev) => [newEntry, ...prev].slice(0, 12));
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  }, [activeMovement, activePalette, aiResult, gallery.length, sourceLabel]);

  const handleApplyFromCatalogOrCompare = useCallback(
    (id: MovementAlgorithm) => {
      handleSelectMovement(id);
      document.getElementById("estudio")?.scrollIntoView({ behavior: "smooth" });
    },
    [handleSelectMovement]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0A0A0A]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
            e.target.value = "";
          }
        }}
      />

      <TopBar onTriggerUpload={() => fileInputRef.current?.click()} />

      <main className="flex-1">
        {/* Studio Hero & Interactive Easel Workspace */}
        <section id="estudio" className="pt-8 pb-16 lg:pt-12 lg:pb-20">
          <div className="max-w-[1360px] mx-auto px-6 lg:px-10">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
                  Estudio de reinterpretación pictórica
                </p>
                <h1 className="font-serif text-4xl lg:text-5xl font-semibold tracking-tight text-[#0A0A0A] text-balance">
                  Adapta tus fotografías a grandes movimientos artísticos
                </h1>
              </div>
              <p className="text-sm text-[#52524E] max-w-md leading-relaxed">
                Carga una fotografía o elige una obra base, aplica filtros pictóricos
                preconfigurados en tiempo real o deja que la inteligencia artificial calibre
                pigmentos y trazos según la composición de tu imagen.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-8 items-start">
              <StudioEasel
                canvasRef={mainCanvasRef}
                sourceUrl={sourceUrl}
                sourceLabel={sourceLabel}
                activeMovement={activeMovement}
                activePalette={activePalette}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                onSelectSample={handleSelectSample}
                onFileUpload={handleFileUpload}
                onDownload={handleDownload}
                onSaveToGallery={handleSaveToGallery}
                justSaved={justSaved}
                isRendering={isRendering}
                isAdaptingAi={isAdaptingAi}
                aiResult={aiResult}
                dimensions={dimensions}
              />

              <ControlPanel
                activeMovement={activeMovement}
                onSelectMovement={handleSelectMovement}
                params={params}
                onChangeParams={handleChangeParams}
                presetLevel={presetLevel}
                onSelectPreset={handleSelectPreset}
                onResetMovement={handleResetMovement}
                onAdaptWithAi={handleAdaptWithAi}
                isAdaptingAi={isAdaptingAi}
                aiError={aiError}
                onTriggerUpload={() => fileInputRef.current?.click()}
              />
            </div>
          </div>
        </section>

        <MovementsCatalog
          activeMovementId={movementId}
          onApplyMovement={handleApplyFromCatalogOrCompare}
        />

        <ComparisonSheet
          sourceImage={loadedImage}
          onSelectMovement={handleApplyFromCatalogOrCompare}
        />

        <GallerySection
          items={gallery}
          onInspect={setInspectedArtwork}
          onRemove={(id) => setGallery((prev) => prev.filter((item) => item.id !== id))}
        />
      </main>

      <footer className="border-t border-[#E6E6E2] bg-white py-8">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#6B6B68]">
          <span className="font-serif text-base text-[#0A0A0A]">Atelier Cromático</span>
          <span>
            Estudio curatorial de estilos artísticos · Procesamiento local en lienzo y calibración
            por inteligencia artificial
          </span>
        </div>
      </footer>

      <ArtworkLightbox
        artwork={inspectedArtwork}
        onClose={() => setInspectedArtwork(null)}
      />
    </div>
  );
}
