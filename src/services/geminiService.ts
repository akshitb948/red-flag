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

export async function scanRelationship(situation: string, mode: ScanMode, partnerName: string, partnerGender: string, userGender: string): Promise<ScanResult> {
  try {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ situation, mode, partnerName, partnerGender, userGender }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
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
