import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AnalyzeInput = z.object({
  imageDataUrl: z
    .string()
    .min(100)
    .max(20_000_000)
    .refine((value) => /^data:image\/(jpeg|png|webp);base64,/.test(value), "Unsupported image"),
});

export type StarDetection = {
  id: number;
  confidence: number;
  label: string;
  center: { x: number; y: number };
  radius: number;
};

export type StarAnalysis = {
  count: number;
  confidence: number;
  summary: string;
  detections: StarDetection[];
};

const starSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    count: { type: "integer" },
    confidence: { type: "number" },
    summary: { type: "string" },
    detections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "integer" },
          confidence: { type: "number" },
          label: { type: "string" },
          center: {
            type: "object",
            additionalProperties: false,
            properties: { x: { type: "number" }, y: { type: "number" } },
            required: ["x", "y"],
          },
          radius: { type: "number" },
        },
        required: ["id", "confidence", "label", "center", "radius"],
      },
    },
  },
  required: ["count", "confidence", "summary", "detections"],
} as const;

function parseSseText(text: string) {
  let output = "";
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const raw = line.slice(6);
    if (raw === "[DONE]") continue;
    try {
      const event = JSON.parse(raw) as { type?: string; delta?: string };
      if (event.type === "response.output_text.delta" && event.delta) output += event.delta;
    } catch {
      // Ignore keepalive or incomplete event lines.
    }
  }
  return output;
}

export const analyzeStars = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<{ analysis?: StarAnalysis; error?: string }> => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { error: "AI analysis is not configured for this workspace." };

    const body = {
      model: "openai/gpt-6-astra",
      stream: true,
      reasoning: { effort: "low", summary: "concise" },
      include: ["reasoning.encrypted_content"],
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this night-sky image. Count only distinct, visible point-light sources that look like stars. Ignore faint noise, lens artifacts, satellites, clouds, and duplicated detections. For each detected star, provide its center as a percentage of image width and height (0-100) and an approximate radius as a percentage of image width. Confidence values must be from 0 to 1. Keep the summary under 24 words. Return JSON matching the schema.",
            },
            { type: "input_image", image_url: data.imageDataUrl },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "star_analysis",
          strict: true,
          schema: starSchema,
        },
      },
    };

    const delays = [0, 1200, 3000];
    for (let attempt = 0; attempt < delays.length; attempt += 1) {
      const delay = delays[attempt] ?? 0;
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = await response.text();
        let message = payload;
        try {
          const parsed = JSON.parse(payload) as { message?: string; error?: { message?: string } };
          message = parsed.error?.message ?? parsed.message ?? payload;
        } catch {
          // Keep the provider response as-is.
        }
        if ((response.status === 429 || response.status >= 500) && attempt < delays.length - 1) continue;
        return { error: message || `Star analysis failed (${response.status}).` };
      }

      const text = parseSseText(await response.text());
      if (!text) return { error: "The analysis completed without a result. Please try another image." };
      try {
        const parsed = JSON.parse(text) as StarAnalysis;
        const detections = parsed.detections.map((item, index) => ({
          ...item,
          id: index + 1,
          confidence: Math.max(0, Math.min(1, item.confidence)),
          center: {
            x: Math.max(0, Math.min(100, item.center.x)),
            y: Math.max(0, Math.min(100, item.center.y)),
          },
          radius: Math.max(0.2, Math.min(8, item.radius)),
        }));
        return {
          analysis: {
            ...parsed,
            count: detections.length,
            confidence: Math.max(0, Math.min(1, parsed.confidence)),
            detections,
          },
        };
      } catch {
        return { error: "The star map could not be read. Please retry the analysis." };
      }
    }
    return { error: "Star analysis is temporarily unavailable." };
  });
