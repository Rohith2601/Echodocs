// src/types.ts
export type ZoneType = "repetition" | "contradiction" | "gap" | "todo";

export interface SuggestionZone {
  id: string;
  type: ZoneType;
  startOffset: number;
  endOffset: number;
  message: string;
  confidence: number;
  relatedOffsets?: { start: number; end: number }[];
}
