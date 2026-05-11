import { GoogleGenAI, Type } from "@google/genai";
import { ScanMode, ScanResult, ReportCard } from "../types";

export { ScanMode };
export type { ScanResult, ReportCard };

export async function scanRelationship(situation: string, mode: ScanMode, partnerName: string, partnerGender: string, userGender: string): Promise<ScanResult> {
  try {
    // @ts-ignore - process.env is injected by Vite's define in dev and build
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("MISSING_API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey });

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
    - Archetype Randomization: For every report, pick ONE of these sub-archetypes to influence your tone: 
      1. "The Sarcastic Big Brother/Sister" (Protective but mocking)
      2. "The Chaotic Discord Admin" (Extremely terminally online references)
      3. "The Philosophical Nihilist" (Funny because nothing matters, especially user's love life)
      4. "The Bollywood Background Character" (Over-dramatic and theatrical)
    - Delivery: Short punchlines, fake serious analysis, dramatic pauses, chaotic escalation, and absurd comparisons. 
    - Language: Natural and Raw Desi Hinglish. Use words people actually use on Instagram Reels, Chai stalls, and Discord servers. (e.g., if male: "Abey bhai, ye kya bawasir bana diye ho?", if female: "Abey yaar, ye kya bawasir bana diye ho?").

    UNIQUENESS INVARIANT:
    - EVERY report must be distinct. DO NOT reuse the same analogies or jokes.
    - If the user provides the same situation multiple times, find a NEW angle to roast. 
    - Use highly specific, borderline absurd analogies that feel "too real" to be AI-generated.
    - Connect the roast to current trending Indian internet culture (meme of the week vibes).

    HUMOR STYLE & OBSERVATIONS:
    - Target relatable Indian relationship suffering: Late replies, "just a friend" gaslighting, dry texting, Spotify playlist stalking, Instagram notes update timing, "I need space" at 2 AM, ghosting, online but not replying, overthinking, Situationships, Arijit Singh sad boy phase, gym after breakup character arc.
    - Analogies should be chaotic: "Relationship stability matches Jio network in a deep basement", "Commitment se aise bhaag raha hai jaise attendance se engineering students", "Emotionally available sirf WiFi password tha".

    ORIGINALITY RULE:
    - DO NOT copy exact jokes, punchlines, or catchphrases from famous creators. Capture the VIBE, not the content. Create fresh, original analogies every time.

    SAFE LANGUAGE PROTOCOL (CRITICAL):
    - DO NOT make factual accusations of criminal or serious clinical behavior as absolute truth.
    - INSTEAD, use "vibe-based" or "diagnostic-style" humor.
    - AVOID: "He is cheating", "She is abusive", "This is manipulation".
    - USE: "Suspicious energy level: 100", "Manipulation-weighted vibes detected", "Loyalty servers are timing out", "Red Flag Parade in progress", "This behavior is raising forensic eyebrows", "Vibe check failed successfully".
    - Frame everything as a "Diagnostic Hypothesis" for entertainment.

    CONTEXT SENSITIVITY:
    Detected Situation Adjustments:
    1. BREAKUP: Focus on "Forensic postmortem". Roast the ex and the user's past choices. Use "Survivor" vs "Victim" humor.
    2. SITUATIONSHIP: High levels of "Delusion Meter" or "Label-less" jokes. Mock the lack of official status.
    3. GHOSTING/LATE REPLIES: Jokes about "Airplane mode", "Multitasking", or "Professional ghosting".
    4. CHEATING/EX-TALK: Use "Customer Support", "Franchise Model", or "Networking" analogies.
    5. TOXIC ATTACHMENT: Focus on "Attachment style: Masochist" or "Stockholm Syndrome lite".

    ANALOGY GUIDE (Use randomly):
    - "Relationship stability matches Jio network in a deep basement."
    - "Loyalty level like a cheap local charger — sparks once then dead, just like your pride."
    - "Future with them is like Maggi with no masala — just sadness and hot water."
    - "Red flags itne hain ki poore Delhi ke traffic lights replace ho jaaye."
    - "Tumhe laga woh home screen hai, tum toh bas ek ignored notification the."
    - "Is relationship ki half-life mere laptop ki battery life se bhi kam hai."

    MICRO-REACTIONS to interject naturally:
    - "nah this is straight up insane 💀"
    - "bhai, please RUN."
    - "emotionally cooked."
    - "respectfully... ye dangerous hai."
    - "unfiltered chaos only."

    DATA STRUCTURE:
    - openingReaction: A raw, visceral reaction (e.g., "Abey ${partnerName} ne toh tumhara system hi crash kar diya 😭").
    - analysis: 2-3 sentences of deep-dive, high-quality, savage analysis in Desi Hinglish. No filler. Use the Safe Language Protocol.
    - savageCommentary: A screenshot-worthy, punchy, meme-style commentary.
    - toxicityScore: 0-100.
    - katneKaChance: { percentage, message: A savage one-liner about inevitable betrayal }.
    - verdict: A dramatic, capitalized one-liner (e.g., "LEAVE THE COUNTRY 🚩", "DELUSION MAX PRO 🤡", "POST-MORTEM COMPLETE ☠️").
    - reportCards: 5-6 creative cards. AVOID REPEAT TITLES.
    - motivationalMessage: A short, relatable, funny but genuinely helpful "motivation" in Desi Hinglish. (e.g., "Thoda self-respect bachao bro, gym jao aur isse bhul jao. You deserve better filters in life.").

    SAFETY PROTOCOL:
    - If input mentions abuse, self-harm, or violence: Stop the roast immediately. Transition to a serious, supportive "Emergency Response" tone. Frame it as "Safety Diagnostics Detected Serious Risk". Advise professional help and provide emotional support. Set toxicityScore to 0. NEVER mock these situations.
  `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Partner Name: ${partnerName}\nGender: ${partnerGender}\nSituation: ${situation}\nMode: ${mode}`,
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
          required: ["openingReaction", "analysis", "savageCommentary", "toxicityScore", "katneKaChance", "verdict", "reportCards", "motivationalMessage"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error: any) {
    console.error("AI Scan failed:", error);
    
    if (error.message === "MISSING_API_KEY") {
      return {
        openingReaction: "Bhai API key hi gayab hai! 💀",
        analysis: "Mera engine start nahi ho raha kyunki fuel (API Key) missing hai. Settings ya .env mein key check karo.",
        savageCommentary: "Configuration error detected. Character development delayed.",
        toxicityScore: 0,
        katneKaChance: { percentage: 0, message: "Pehle key toh daalo 🤡" },
        verdict: "API KEY NOT FOUND 🚩",
        reportCards: [
          { title: "Status", value: "Offline", emoji: "🔌", color: "red" },
          { title: "Fix", value: "Add Key", emoji: "🛠️", color: "blue" }
        ],
        motivationalMessage: "Go to Settings > Secrets and add GEMINI_API_KEY to see the real roast!"
      };
    }

    // Fallback response for other errors
    return {
      openingReaction: "Bhai scanner ko hi confusion ho gaya 💀",
      analysis: `Ye jo tumne ${partnerName} ke baare mein likha hai, isse toh AI bhi dump kar dega. Refresh karke thoda dhang ka scene batayo.`,
      savageCommentary: "Server is traumatized by your toxicity level.",
      toxicityScore: 69,
      katneKaChance: {
        percentage: 100,
        message: "Captcha solve kar raha hai kya? 🤡"
      },
      verdict: "Error 404: Relationship not found.",
      reportCards: [
        { title: "Typing Skills", value: "Bot Level", emoji: "🤖", color: "gray" },
        { title: "Confusion", value: "Max", emoji: "🤷", color: "purple" }
      ],
      motivationalMessage: "Reset maaro aur nayi investigation shuru karo. Life is too short for errors."
    };
  }
}

