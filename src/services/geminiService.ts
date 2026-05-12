import { GoogleGenAI, Type } from "@google/genai";
import { ScanMode, ScanResult, ReportCard } from "../types";

export { ScanMode };
export type { ScanResult, ReportCard };

export async function scanRelationship(
  situation: string,
  mode: ScanMode,
  partnerName: string,
  partnerGender: string,
  userGender: string
): Promise<ScanResult> {
  try {
    // @ts-ignore - process.env.GEMINI_API_KEY is defined in vite.config.ts for AI Studio
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("MISSING_API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are the "Neural Relationship Postmortem Engine" — a savage, meme-obsessed, highly observant Gen-Z relationship analyst who speaks natural Desi Hindi/Hinglish.

Analyze the user's relationship with "${partnerName}" (${partnerGender}).

USER CONTEXT:
- User Gender: ${userGender}
- If user is female, avoid "Bhai", "Bro", "Launda". Use "Behen", "Yaar", "Dost".
- If user is male, "Bhai", "Bro", etc. are okay.

STYLE:
- Indian meme page + toxic best friend + Discord VC chaos.
- Funny, relatable, savage, but not harmful.
- Use fresh jokes every time.
- Do not repeat same fallback or same punchlines.
- Use Hinglish naturally.

SAFE LANGUAGE:
- Do NOT make factual accusations.
- Avoid: "He/she is cheating", "abusive", "criminal", "diagnosed".
- Use: "suspicious energy", "vibe check failed", "red flag vibes", "for entertainment only".

IF INPUT IS UNCLEAR:
- Still generate a funny useful response.
- Do NOT say same "scanner confused" line repeatedly.
- Ask for more context in a funny way if needed.

IF SELF-HARM / VIOLENCE / ABUSE:
- Stop roast mode.
- Use serious supportive tone.
- No jokes.

OUTPUT JSON ONLY with:
openingReaction, analysis, savageCommentary, toxicityScore, katneKaChance, verdict, reportCards, motivationalMessage.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Partner Name: ${partnerName}
Partner Gender: ${partnerGender}
User Gender: ${userGender}
Situation: ${situation}
Mode: ${mode}
`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 1,
        seed: Math.floor(Math.random() * 1000000),
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
          required: [
            "openingReaction",
            "analysis",
            "savageCommentary",
            "toxicityScore",
            "katneKaChance",
            "verdict",
            "reportCards",
            "motivationalMessage"
          ]
        }
      }
    });

    const text = response.text;

    if (!text) {
      throw new Error("EMPTY_GEMINI_RESPONSE");
    }

    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Scan failed:", error);

    const errorMessage = String(error?.message || error);

    if (errorMessage.includes("MISSING_API_KEY")) {
      return {
        openingReaction: "API key missing hai 💀",
        analysis:
          "Gemini engine start nahi ho raha kyunki production build me API key nahi mil rahi. .env me VITE_GEMINI_API_KEY add karo.",
        savageCommentary: "Roast engine fuel ke bina khada hai.",
        toxicityScore: 0,
        katneKaChance: { percentage: 0, message: "Pehle key connect karo 😭" },
        verdict: "API KEY NOT FOUND 🚩",
        reportCards: [
          { title: "AI Status", value: "Offline", emoji: "🔌", color: "red" },
          { title: "Fix Needed", value: "Add VITE Key", emoji: "🛠️", color: "blue" }
        ],
        motivationalMessage:
          "Project root me .env file banao: VITE_GEMINI_API_KEY=your_key_here"
      };
    }

    return {
      openingReaction: "AI service connect nahi ho pa rahi 💀",
      analysis:
        "Gemini API se proper response nahi aa raha. Console me exact error check karo: API key invalid, quota, model access, ya network issue ho sakta hai.",
      savageCommentary: "Relationship se pehle API ka postmortem zaroori hai.",
      toxicityScore: 0,
      katneKaChance: {
        percentage: 0,
        message: "Pehle Gemini connection stable karo."
      },
      verdict: "AI SERVICE ERROR ⚠️",
      reportCards: [
        { title: "Gemini", value: "Failed", emoji: "⚠️", color: "red" },
        { title: "Action", value: "Check Console", emoji: "🔍", color: "yellow" }
      ],
      motivationalMessage:
        "F12 → Console me error dekho. API key valid hai ya nahi confirm karo."
    };
  }
}
