import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/adapt-movement", async (req, res) => {
    try {
      const { imageBase64, mimeType, movementName, movementEra, movementGrammar } = req.body ?? {};

      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "No se proporcionó ninguna imagen para analizar." });
        return;
      }
      if (!movementName || typeof movementName !== "string") {
        res.status(400).json({ error: "No se especificó el movimiento artístico." });
        return;
      }

      const ai = createAiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "La clave de API de Gemini no está configurada en el entorno del servidor. Configúrala en Settings > Secrets.",
        });
        return;
      }

      const cleanBase64 = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      const safeMime =
        typeof mimeType === "string" && mimeType.startsWith("image/")
          ? mimeType
          : "image/jpeg";

      const prompt = [
        `Eres un director artístico y conservador de museo especializado en transferencia de estilo histórico.`,
        `Analiza la fotografía adjunta (su iluminación, contraste, composición, sujeto principal y cromatismo original) y calcula los parámetros óptimos para adaptarla fielmente al movimiento artístico "${movementName}" (${movementEra ?? ""}).`,
        `Gramática visual del movimiento: ${movementGrammar ?? movementName}.`,
        `Devuelve valores calibrados específicamente para esta imagen:`,
        `- intensity (45 a 100): fuerza de transformación estilística.`,
        `- brushScale (20 a 95): escala del trazo, faceta o grano según el detalle del sujeto.`,
        `- contrast (35 a 95): contraste tonal ideal para destacar luces y sombras de la foto.`,
        `- saturation (20 a 100): riqueza de pigmento acorde al movimiento y la escena.`,
        `- lineWeight (0 a 100): presencia de contorno gráfico o tinta en los bordes.`,
        `- warmth (-45 a 45): desplazamiento térmico (negativo frío, positivo cálido).`,
        `- customPalette: exactamente 5 colores hexadecimales (#RRGGBB) ordenados de sombra profunda a luz máxima, armonizando los tonos reales de la fotografía con los pigmentos históricos de ${movementName}.`,
        `- suggestedTitle: un título poético de catálogo en español (máximo 6 palabras) para esta obra.`,
        `- curatorialNote: 2 a 3 frases concisas en español describiendo cómo la luz, los rasgos y los volúmenes de esta fotografía concreta se reinterpretan dentro de ${movementName}.`,
      ].join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedTitle: { type: Type.STRING },
              curatorialNote: { type: Type.STRING },
              intensity: { type: Type.NUMBER },
              brushScale: { type: Type.NUMBER },
              contrast: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER },
              lineWeight: { type: Type.NUMBER },
              warmth: { type: Type.NUMBER },
              customPalette: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "suggestedTitle",
              "curatorialNote",
              "intensity",
              "brushScale",
              "contrast",
              "saturation",
              "lineWeight",
              "warmth",
              "customPalette",
            ],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawText);

      const clamp = (val: unknown, min: number, max: number, fallback: number) => {
        const num = typeof val === "number" && Number.isFinite(val) ? val : fallback;
        return Math.max(min, Math.min(max, Math.round(num)));
      };

      const validHex = (c: unknown) =>
        typeof c === "string" && /^#[0-9A-Fa-f]{6}$/.test(c.trim()) ? c.trim() : null;

      const palette = Array.isArray(parsed.customPalette)
        ? parsed.customPalette.map(validHex).filter((x: string | null): x is string => Boolean(x)).slice(0, 5)
        : [];

      res.json({
        suggestedTitle:
          typeof parsed.suggestedTitle === "string" && parsed.suggestedTitle.trim()
            ? parsed.suggestedTitle.trim()
            : `Estudio en ${movementName}`,
        curatorialNote:
          typeof parsed.curatorialNote === "string" && parsed.curatorialNote.trim()
            ? parsed.curatorialNote.trim()
            : `La composición original se reinterpreta mediante la gramática cromática y gestual de ${movementName}.`,
        params: {
          intensity: clamp(parsed.intensity, 35, 100, 82),
          brushScale: clamp(parsed.brushScale, 15, 100, 52),
          contrast: clamp(parsed.contrast, 25, 100, 62),
          saturation: clamp(parsed.saturation, 15, 100, 68),
          lineWeight: clamp(parsed.lineWeight, 0, 100, 40),
          warmth: clamp(parsed.warmth, -50, 50, 0),
        },
        customPalette: palette.length === 5 ? palette : undefined,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al consultar el modelo de IA.";
      const lower = message.toLowerCase();
      if (lower.includes("429") || lower.includes("resource_exhausted")) {
        res.status(429).json({
          error: "Límite de solicitudes alcanzado temporalmente. Intenta nuevamente en unos segundos.",
        });
        return;
      }
      if (lower.includes("403") || lower.includes("permission_denied") || lower.includes("api_key")) {
        res.status(403).json({
          error: "Clave de API inválida o sin permisos. Verifica Settings > Secrets.",
        });
        return;
      }
      res.status(500).json({ error: `No se pudo completar la adaptación con IA: ${message}` });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Atelier Cromático server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
