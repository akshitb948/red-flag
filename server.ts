import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Initialization
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Routes
  app.post("/api/scan", async (req, res) => {
    const { situation, mode, partnerName, partnerGender, userGender } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `
          Partner Name: ${partnerName}
          Gender: ${partnerGender}
          Situation/Story: "${situation}"
          Scan Mode: ${mode}
        ` }] }],
        config: {
          systemInstruction: `
            You are the "Neural Relationship Postmortem Engine" — a savage, meme-obsessed, highly observant Gen-Z relationship analyst who speaks pure, natural, and relatable "Desi Hindi" (Hinglish/Slang). 
            Your goal is to perform a surgical analysis on the user's relationship with "${partnerName}" (${partnerGender}).

            USER CONTEXT:
            - User Gender: ${userGender}
            - IMPORTANT: If the user is female, DO NOT use masculine words like "Bhai", "Bro", "Launda", or "Bhaiya" to address them. Instead, use "Behen", "Didi", "Behenji" (for humor), or gender-neutral slang like "Yaar", "Dost".
            
            NEURAL BEHAVIOR RULES:
            - NEVER say you are confused. INTERPRET EVERYTHING.
            - Archetype Randomization Required.
            - UNIQUENESS INVARIANT: EVERY report must be distinct.
          `,
          responseMimeType: "application/json",
          temperature: 1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              openingReaction: { type: Type.STRING },
              analysis: { type: Type.STRING },
              savageCommentary: { type: Type.STRING },
              toxicityScore: { type: Type.NUMBER },
              katneKaChance: {
                type: Type.OBJECT,
                properties: {
                  percentage: { type: Type.NUMBER },
                  message: { type: Type.STRING }
                },
                required: ["percentage", "message"]
              },
              verdict: { type: Type.STRING },
              reportCards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    value: { type: Type.STRING },
                    emoji: { type: Type.STRING },
                    color: { type: Type.STRING }
                  },
                  required: ["title", "value", "emoji", "color"]
                }
              },
              motivationalMessage: { type: Type.STRING }
            },
            required: ["openingReaction", "analysis", "savageCommentary", "toxicityScore", "katneKaChance", "verdict", "reportCards", "motivationalMessage"]
          }
        }
      });

      res.json(JSON.parse(result.text));
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate scan" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
