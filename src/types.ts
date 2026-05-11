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
