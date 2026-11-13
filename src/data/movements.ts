import sampleStillLifeUrl from "../assets/images/sample_still_life_1794529776927.jpg";
import sampleCoastalUrl from "../assets/images/sample_coastal_arch_1794529777812.jpg";

export type MovementAlgorithm =
  | "impressionism"
  | "postimpressionism"
  | "expressionism"
  | "cubism"
  | "popart"
  | "ukiyoe"
  | "pointillism"
  | "chiaroscuro"
  | "fauvism"
  | "topographic_ink";

export interface FilterParams {
  intensity: number; // 0-100
  brushScale: number; // 10-100
  contrast: number; // 0-100
  saturation: number; // 0-100
  lineWeight: number; // 0-100
  warmth: number; // -50 to 50
}

export interface ArtMovement {
  id: MovementAlgorithm;
  name: string;
  era: string;
  exponents: string;
  origin: string;
  shortTag: string;
  grammar: string;
  description: string;
  palette: [string, string, string, string, string]; // shadow -> highlight
  defaultParams: FilterParams;
  presets: {
    sutil: FilterParams;
    canonico: FilterParams;
    vanguardia: FilterParams;
  };
}

export const ART_MOVEMENTS: ArtMovement[] = [
  {
    id: "impressionism",
    name: "Impresionismo",
    era: "1867–1886",
    exponents: "Monet · Renoir · Degas",
    origin: "París, Francia",
    shortTag: "Luz fugaz y pincelada dividida",
    grammar:
      "Pinceladas cortas y sueltas orientadas por la luz, sombras violetas y azules sin negro puro, mezcla óptica luminosa.",
    description:
      "Disuelve los contornos rígidos en toques rápidos de color puro que capturan la vibración atmosférica de la luz natural.",
    palette: ["#2A3659", "#5B7496", "#A7B89E", "#E6C78A", "#FAF3DE"],
    defaultParams: {
      intensity: 84,
      brushScale: 48,
      contrast: 50,
      saturation: 66,
      lineWeight: 10,
      warmth: 12,
    },
    presets: {
      sutil: { intensity: 58, brushScale: 32, contrast: 48, saturation: 56, lineWeight: 5, warmth: 8 },
      canonico: { intensity: 84, brushScale: 48, contrast: 50, saturation: 66, lineWeight: 10, warmth: 12 },
      vanguardia: { intensity: 96, brushScale: 68, contrast: 58, saturation: 78, lineWeight: 14, warmth: 18 },
    },
  },
  {
    id: "postimpressionism",
    name: "Postimpresionismo",
    era: "1886–1905",
    exponents: "Van Gogh · Cézanne · Gauguin",
    origin: "Francia / Países Bajos",
    shortTag: "Empaste rítmico y flujo cromático",
    grammar:
      "Trazos direccionales en espiral y empaste expresivo, contrastes complementarios azul cobalto y amarillo cromo.",
    description:
      "Organiza la superficie mediante corrientes rítmicas de pinceladas densas que intensifican la carga emocional y estructural.",
    palette: ["#152242", "#224B8A", "#4C8C7E", "#D9A826", "#F7E28B"],
    defaultParams: {
      intensity: 88,
      brushScale: 54,
      contrast: 68,
      saturation: 78,
      lineWeight: 32,
      warmth: 8,
    },
    presets: {
      sutil: { intensity: 64, brushScale: 38, contrast: 56, saturation: 64, lineWeight: 20, warmth: 4 },
      canonico: { intensity: 88, brushScale: 54, contrast: 68, saturation: 78, lineWeight: 32, warmth: 8 },
      vanguardia: { intensity: 98, brushScale: 72, contrast: 80, saturation: 92, lineWeight: 46, warmth: 14 },
    },
  },
  {
    id: "expressionism",
    name: "Expresionismo",
    era: "1905–1925",
    exponents: "Munch · Kirchner · Schiele",
    origin: "Alemania / Noruega",
    shortTag: "Tensión psicológica y contorno nervioso",
    grammar:
      "Trazos angulares y nerviosos, distorsión tonal dramática, contornos de tinta marcados y cromatismo ácido o melancólico.",
    description:
      "Subordina la fidelidad fotográfica a la intensidad interior mediante contrastes abruptos, ángulos incisivos y trazos febriles.",
    palette: ["#17151C", "#3A4E59", "#8E9C8E", "#D99F26", "#F0D879"],
    defaultParams: {
      intensity: 86,
      brushScale: 50,
      contrast: 78,
      saturation: 62,
      lineWeight: 74,
      warmth: -6,
    },
    presets: {
      sutil: { intensity: 62, brushScale: 36, contrast: 64, saturation: 54, lineWeight: 48, warmth: -4 },
      canonico: { intensity: 86, brushScale: 50, contrast: 78, saturation: 62, lineWeight: 74, warmth: -6 },
      vanguardia: { intensity: 98, brushScale: 66, contrast: 92, saturation: 74, lineWeight: 92, warmth: -12 },
    },
  },
  {
    id: "cubism",
    name: "Cubismo Analítico",
    era: "1907–1914",
    exponents: "Picasso · Braque · Gris",
    origin: "París, Francia",
    shortTag: "Facetas geométricas y múltiples planos",
    grammar:
      "Descomposición del volumen en planos poligonales facetados, aristas definidas y paleta austera de ocres, tierras y pizarra.",
    description:
      "Fractura la perspectiva única en una arquitectura de facetas angulares que revelan simultáneamente estructura y sombra.",
    palette: ["#1E1C1A", "#4A443D", "#7A746B", "#B59C78", "#E3D6C1"],
    defaultParams: {
      intensity: 90,
      brushScale: 58,
      contrast: 66,
      saturation: 34,
      lineWeight: 62,
      warmth: 10,
    },
    presets: {
      sutil: { intensity: 65, brushScale: 38, contrast: 56, saturation: 42, lineWeight: 40, warmth: 6 },
      canonico: { intensity: 90, brushScale: 58, contrast: 66, saturation: 34, lineWeight: 62, warmth: 10 },
      vanguardia: { intensity: 100, brushScale: 78, contrast: 78, saturation: 24, lineWeight: 82, warmth: 14 },
    },
  },
  {
    id: "popart",
    name: "Arte Pop",
    era: "1955–1972",
    exponents: "Warhol · Lichtenstein · Hockney",
    origin: "Londres / Nueva York",
    shortTag: "Serigrafía, tintas planas y semitonos",
    grammar:
      "Posterización de alto impacto en tintas planas saturadas, trama de puntos Ben-Day y perfiles negros de imprenta.",
    description:
      "Traduce la fotografía al lenguaje gráfico de la serigrafía y el cómic comercial con colores planos vibrantes y retícula.",
    palette: ["#111111", "#1D4ED8", "#E11D48", "#FACC15", "#FFFDF5"],
    defaultParams: {
      intensity: 92,
      brushScale: 44,
      contrast: 84,
      saturation: 92,
      lineWeight: 78,
      warmth: 4,
    },
    presets: {
      sutil: { intensity: 68, brushScale: 32, contrast: 70, saturation: 78, lineWeight: 52, warmth: 2 },
      canonico: { intensity: 92, brushScale: 44, contrast: 84, saturation: 92, lineWeight: 78, warmth: 4 },
      vanguardia: { intensity: 100, brushScale: 64, contrast: 96, saturation: 100, lineWeight: 94, warmth: 8 },
    },
  },
  {
    id: "ukiyoe",
    name: "Ukiyo-e (Grabado)",
    era: "1680–1868",
    exponents: "Hokusai · Hiroshige · Utamaro",
    origin: "Edo (Tokio), Japón",
    shortTag: "Xilografía mineral y línea sumi-e",
    grammar:
      "Áreas planas de pigmento mineral sobre papel washi, contornos caligráficos de tinta negra y gradación bokashi.",
    description:
      "Sintetiza el volumen en zonas planas de azul de Prusia, bermellón y ocre enmarcadas por incisiones firmes de xilografía.",
    palette: ["#1A222E", "#2C4C6E", "#A64B37", "#D9B98B", "#F2E9D8"],
    defaultParams: {
      intensity: 88,
      brushScale: 46,
      contrast: 60,
      saturation: 56,
      lineWeight: 82,
      warmth: 14,
    },
    presets: {
      sutil: { intensity: 62, brushScale: 30, contrast: 52, saturation: 50, lineWeight: 56, warmth: 8 },
      canonico: { intensity: 88, brushScale: 46, contrast: 60, saturation: 56, lineWeight: 82, warmth: 14 },
      vanguardia: { intensity: 98, brushScale: 62, contrast: 72, saturation: 68, lineWeight: 96, warmth: 20 },
    },
  },
  {
    id: "pointillism",
    name: "Puntillismo",
    era: "1884–1900",
    exponents: "Seurat · Signac · Cross",
    origin: "París, Francia",
    shortTag: "División cromática en puntos puros",
    grammar:
      "Retícula orgánica de puntos diminutos de color puro que el ojo recompone a distancia con luminosidad vibrante.",
    description:
      "Reemplaza la mezcla física en paleta por miles de toques puntuales independientes sobre un fondo de imprimación clara.",
    palette: ["#202E54", "#3E6B89", "#78A36D", "#E8B74A", "#FBF7EC"],
    defaultParams: {
      intensity: 90,
      brushScale: 36,
      contrast: 56,
      saturation: 74,
      lineWeight: 0,
      warmth: 6,
    },
    presets: {
      sutil: { intensity: 68, brushScale: 24, contrast: 50, saturation: 64, lineWeight: 0, warmth: 4 },
      canonico: { intensity: 90, brushScale: 36, contrast: 56, saturation: 74, lineWeight: 0, warmth: 6 },
      vanguardia: { intensity: 100, brushScale: 58, contrast: 64, saturation: 88, lineWeight: 0, warmth: 10 },
    },
  },
  {
    id: "chiaroscuro",
    name: "Claroscuro Barroco",
    era: "1595–1670",
    exponents: "Caravaggio · Rembrandt · Ribera",
    origin: "Roma / Ámsterdam",
    shortTag: "Tenebrismo teatral y veladura áurea",
    grammar:
      "Iluminación direccional intensa emergiendo de penumbras profundas en tierra sombra, con reflejos cálidos dorados.",
    description:
      "Esculpe las figuras mediante un haz de luz diagonal que recorta los volúmenes sobre fondos aterciopelados oscuros.",
    palette: ["#0C0A09", "#291E16", "#6E4726", "#C4914D", "#F4DFB6"],
    defaultParams: {
      intensity: 88,
      brushScale: 42,
      contrast: 86,
      saturation: 46,
      lineWeight: 16,
      warmth: 24,
    },
    presets: {
      sutil: { intensity: 62, brushScale: 28, contrast: 68, saturation: 48, lineWeight: 10, warmth: 16 },
      canonico: { intensity: 88, brushScale: 42, contrast: 86, saturation: 46, lineWeight: 16, warmth: 24 },
      vanguardia: { intensity: 98, brushScale: 56, contrast: 98, saturation: 40, lineWeight: 22, warmth: 32 },
    },
  },
  {
    id: "fauvism",
    name: "Fauvismo",
    era: "1904–1908",
    exponents: "Matisse · Derain · Vlaminck",
    origin: "París, Francia",
    shortTag: "Color liberado y audacia cromática",
    grammar:
      "Color puro no descriptivo aplicado en planos audaces, sombras en violeta o turquesa y luces incandescentes.",
    description:
      "Desliga el color de la realidad óptica para expresar pura energía vital mediante contrastes cromáticos indómitos.",
    palette: ["#2E1A47", "#0F766E", "#EA580C", "#EAB308", "#FEF08A"],
    defaultParams: {
      intensity: 90,
      brushScale: 56,
      contrast: 66,
      saturation: 94,
      lineWeight: 26,
      warmth: 12,
    },
    presets: {
      sutil: { intensity: 64, brushScale: 40, contrast: 58, saturation: 76, lineWeight: 16, warmth: 8 },
      canonico: { intensity: 90, brushScale: 56, contrast: 66, saturation: 94, lineWeight: 26, warmth: 12 },
      vanguardia: { intensity: 100, brushScale: 74, contrast: 76, saturation: 100, lineWeight: 38, warmth: 18 },
    },
  },
  {
    id: "topographic_ink",
    name: "Tinta Topográfica",
    era: "Contemporáneo",
    exponents: "Egon Schiele · Grabado Lineal",
    origin: "Estudio Gráfico",
    shortTag: "Curvas de nivel, plumilla y bicromía",
    grammar:
      "Líneas continuas de contorno topográfico, achurado nervioso en sombras y bicromía de papel pálido con acento ocre.",
    description:
      "Traduce los volúmenes en mapas de curvas de nivel y tramas de tinta china sobre papel mineral con acentos selectivos.",
    palette: ["#111315", "#5B6A6E", "#C4D1D1", "#E7BA36", "#F7DB6A"],
    defaultParams: {
      intensity: 90,
      brushScale: 44,
      contrast: 76,
      saturation: 52,
      lineWeight: 88,
      warmth: 8,
    },
    presets: {
      sutil: { intensity: 66, brushScale: 32, contrast: 64, saturation: 46, lineWeight: 62, warmth: 4 },
      canonico: { intensity: 90, brushScale: 44, contrast: 76, saturation: 52, lineWeight: 88, warmth: 8 },
      vanguardia: { intensity: 100, brushScale: 62, contrast: 88, saturation: 62, lineWeight: 100, warmth: 14 },
    },
  },
];

export const SAMPLE_SOURCES = [
  {
    id: "sample-portrait",
    title: "Retrato en Tinta y Ocre",
    subtitle: "Ilustración expresiva · Archivo adjunto",
    url: "/assets/aistudio/e09076250de4423a341943998ca65aab_914f9c03.jpg",
  },
  {
    id: "sample-still-life",
    title: "Bodegón con Granadas",
    subtitle: "Luz de estudio · Fotografía editorial",
    url: sampleStillLifeUrl,
  },
  {
    id: "sample-coastal",
    title: "Arcos sobre el Mediterráneo",
    subtitle: "Arquitectura y mar · Pleno día",
    url: sampleCoastalUrl,
  },
];
