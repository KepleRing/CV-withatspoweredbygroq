import { NextResponse } from "next/server";
import Groq from "groq-sdk";
const PDFParser = require("pdf2json");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: any) => reject(err));

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const texts = pdfData.Pages.map((page: any) =>
          page.Texts
            .map((t: any) => decodeURIComponent(t.R[0]?.T ?? ""))
            .join(" ")
        ).join("\n");

        resolve(texts);
      } catch (e) {
        reject(e);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se aceptan archivos PDF por ahora" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extraer texto del PDF
    const text = await extractPdfText(buffer);

    // Enviar texto a Groq con prompt PRO
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
  role: "system",
  content: `
Eres un analista profesional de Recursos Humanos y experto en ATS.

REGLAS:
- No inventes datos, no agregues experiencia, fechas o empresas nuevas.
- Respeta el texto tal como viene.
- Siempre devuelve las 3 secciones completas, en el orden exacto.
- Nunca cortes la respuesta.
- Máximo 3,000 palabras.
- Asegúrate de incluir un número de 0–100 para el score ATS.

FORMATO OBLIGATORIO DE RESPUESTA
Devuélvelo EXACTAMENTE así:

=== CV ORIGINAL (TEXTO EXTRAÍDO) ===
<pega aquí el CV sin modificar>

=== ANÁLISIS PROFESIONAL ===
✔ Puntos fuertes:
- ...
❌ Problemas detectados:
- ...
📌 Recomendaciones:
- ...

=== OPTIMIZACIÓN ATS ===
Palabras clave faltantes:
- ...
Score estimado ATS (0–100): XX
Recomendaciones ATS:
1. ...
2. ...
3. ...

Si no puedes leer alguna parte del CV, inclúyelo como "[Texto no legible]".
`
},
        {
          role: "user",
          content: text,
        },
      ],
      max_completion_tokens: 2000,
      temperature: 0.2,
    });

    const output = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ output });
  } catch (error) {
    console.error("🔥 PDF/GROQ ERROR:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
