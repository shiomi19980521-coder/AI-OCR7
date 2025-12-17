export interface TimeEntry {
  dayInt: number | null; // The day of the month (1-31) for sorting/filling gaps
  date: string; // The display string e.g. "10/1" or "20土"
  dayOfWeek: string; // e.g. "Mon", "月"
  startTime1: string;
  endTime1: string;
  startTime2: string;
  endTime2: string;
  totalHours?: number; // Daily total work hours (calculated)
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AnalysisResult {
  entries: TimeEntry[];
  rawText?: string;
}

export interface ProcessingResult {
  id: string;
  fileName: string;
  detectedName: string;
  entries: TimeEntry[];
}

export interface User {
  name: string;
  email: string;
  isPremium: boolean;
  user_metadata?: any;
}