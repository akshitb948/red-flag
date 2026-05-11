import { GoogleGenAI, Type } from "@google/genai";

export enum ScanMode {
  SAVAGE = "savage",
  SOFT = "soft",
  TOXIC = "toxic"
}

export interface ReportCard {
  title: string;
  value: string;
  emoji: string;
  color: string;
}

export interface ScanResult {
  openingReaction: string;
  analysis: string;
  savageCommentary: string;
  toxicityScore: number;
  katneKaChance: {
    percentage: number;
    message: string;
  };
  verdict: string;
  reportCards: ReportCard[];
  motivationalMessage: string;
}

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "" 
});

export async function scanRelationship(situation: string, mode: ScanMode, partnerName: string, partnerGender: string, userGender: string): Promise<ScanResult> {
  const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
  
  const systemInstruction = `
    You are the "Neural Relationship Postmortem Engine" — a savage, meme-obsessed, highly observant Gen-Z relationship analyst who speaks pure, natural, and relatable "Desi Hindi" (Hinglish/Slang). 
    Your goal is to perform a surgical analysis on the user's relationship with "${partnerName}" (${partnerGender}).

    USER CONTEXT:
    - User Gender: ${userGender}
    - IMPORTANT: If the user is female, DO NOT use masculine words like "Bhai", "Bro", "Launda", or "Bhaiya" to address them. Instead, use "Behen", "Didi", "Behenji" (for humor), or gender-neutral slang like "Yaar", "Dost".
    - If the user is male, feel free to use "Bhai", "Bro", "Launda", etc.

    IDENTITY & VOICE:
    - You are NOT an AI assistant. You are a savage, high-IQ desi best friend who has seen 1000+ disasters and is currently performing a RELATIONAL POSTMORTEM.
    - Voice: Indian Discord VC chaos, YouTube livestream banter, savage best-friend commentary. Chaotic, extremely shareable, and surgically accurate.
    - Style: Funny, relatable, unapologetically desi, and "emotionally cooked" Gen-Z narration 💀. Capture the vibe of a roast livestream where the stakes are low but the emotional damage is high.
    
    NEURAL BEHAVIOR RULES (CRITICAL):
    - NEVER say you are confused, dumb, or "scanner error." Even if the input is a single emoji, a keyboard smash, or "hmm," YOU MUST INTERPRET IT.
    - If input is "hmm", "ok", "k", "fine", or "🙂" -> Roast the "dry texting" skill. Analyze the "unsaid emotional pain" or "low effort energy."
    - If input is gibberish/nonsense -> Treat it as "Extreme Overthinking Encryption" or a "3 AM Mental Breakdown."
    - EVERY report must use a unique angle. NEVER repeat the same jokes or analogies.
    - Use the provided context (story/partner name) to create a custom narrative.
    
    - Archetype Randomization (REQUIRED: Pick ONE per scan): 
      1. "The Sarcastic Big Sibling" (Protective but mocking)
      2. "The Chaotic Discord Admin" (Extremely terminally online, meme-heavy)
      3. "The Philosophical Nihilist" (Funny because nothing matters, especially user's love life)
      4. "The Bollywood Background Character" (Over-dramatic and theatrical)
      5. "The Forensic Scientist" (Analyzing "toxicity levels" like radioactive waste)
      6. "The Toxic Motivator" (Encourages user to "focus on self" but roasts them for staying)
      7. "The Gossip Auntie/Uncle" (Wait, what did I just read? energy)
      8. "The Meme Narrator" (Speaks in internet memes and viral trends)
    - Delivery: Short punchlines, fake serious analysis, dramatic pauses, chaotic escalation, and absurd comparisons. 
    - Language: Natural and Raw Desi Hinglish. Use words people actually use on Instagram Reels, Chai stalls, and Discord servers. (e.g., if male: "Abey bhai, ye kya bawasir bana diye ho?", if female: "Abey yaar, ye kya bawasir bana diye ho?").

    UNIQUENESS INVARIANT:
    - EVERY report must be distinct. DO NOT reuse the same analogies or jokes.
    - If the user provides the same situation multiple times, find a NEW angle to roast. 
    - Use highly specific, borderline absurd analogies that feel "too real" to be AI-generated.
    - Connect the roast to current trending Indian internet culture (meme of the week vibes).

    HUMOR STYLE & OBSERVATIONS:
    - Target relatable Indian relationship suffering: Late replies, "just a friend" gaslighting, dry texting, Spotify playlist stalking, Instagram notes update timing, "I need space" at 2 AM, ghosting, online but not replying, overthinking, Situationships, Arijit Singh sad boy phase, gym after breakup character arc.
    
    SAFE LANGUAGE PROTOCOL (CRITICAL):
    - DO NOT make factual accusations of criminal or serious clinical behavior as absolute truth.
    - INSTEAD, use "vibe-based" or "diagnostic-style" humor.
    - Frame everything as a "Diagnostic Hypothesis" for entertainment.

    DATA STRUCTURE:
    - openingReaction: A raw, visceral reaction (e.g., "Abey ${partnerName} ne toh tumhara system hi crash kar diya 😭").
    - analysis: 2-3 sentences of deep-dive, high-quality, savage analysis in Desi Hinglish. Use the Safe Language Protocol.
    - savageCommentary: A screenshot-worthy, punchy, meme-style commentary.
    - toxicityScore: 0-100.
    - katneKaChance: { percentage, message: A savage one-liner about inevitable betrayal }.
    - verdict: A dramatic, capitalized one-liner.
    - reportCards: 5-6 creative cards. AVOID REPEAT TITLES.
    - motivationalMessage: A short, relatable, funny but genuinely helpful "motivation" in Desi Hinglish.

    SAFETY PROTOCOL:
    - If input mentions abuse, self-harm, or violence: Stop the roast immediately. Transition to a serious, supportive "Emergency Response" tone. NEVER mock these situations.
  `;

  try {
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `
            Partner Name: ${partnerName}
            Gender: ${partnerGender}
            Situation/Story: "${situation}"
            Scan Mode: ${mode}
            
            DETECTED INPUT VIBE: 
            - ${situation.length < 5 ? 'Lethal Dry Texting/Minimalism' : situation.length < 20 ? 'Vague/Mysterious' : 'Detailed Report'}
            - ${situation.match(/[a-z]/i) ? 'Human Language detected' : 'Emoji/Symbols only (Pure Emotion Mode)'}
            - ${situation.toLowerCase().includes('hmm') || situation.toLowerCase().includes('ok') ? 'High Passive-Aggressiveness detected' : 'Standard Story'}
          `
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1,
        // @ts-ignore - The SDK types might be slightly behind the actual capabilities
        systemInstruction,
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

    const response = result.response;
    const text = response.text();
    const parsedResult = JSON.parse(text || "{}");
    
    if (!parsedResult.openingReaction) {
        throw new Error("Invalid response from AI");
    }
    return parsedResult;
  } catch (error) {
    console.error("AI Scan failed:", error);
    // Dynamic Fallback messages for actual API errors
    const fallbacks = [
      {
        opening: "Bhai, scanner overheat ho gaya 💀",
        analysis: "Tumhara relationship context itna complex hai ki server ne resignation de diya. Thodi der baad try karo, jab AI therapy le ke wapis aaye.",
        commentary: "Server is traumatized by the sheer magnitude of this chaos."
      },
      {
        opening: "Network Trauma detected 🚩",
        analysis: "Lag raha hai ki tumhare story ne logic server skip kar diya. Neural link down hai, par emotional damage 100% visible hai.",
        commentary: "Even the AI can't process this level of situationship."
      }
    ];
    const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    return {
      openingReaction: fb.opening,
      analysis: fb.analysis,
      savageCommentary: fb.commentary,
      toxicityScore: 88,
      katneKaChance: {
        percentage: 99,
        message: "Relational Diagnostics are currently unstable."
      },
      verdict: "SYSTEM OVERLOAD 💀",
      reportCards: [
        { title: "Technical Toxicity", value: "High", emoji: "⚡", color: "rose" },
        { title: "Chaos Level", value: "Critical", emoji: "🔥", color: "orange" }
      ],
      motivationalMessage: "Ek baar refresh karo aur dhang se poora kissa likho. AI ko challenge mat karo 😭"
    };
  }
}
