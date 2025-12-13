import { TimeEntry } from '../types';

export const exportToGoogleSheet = async (
  spreadsheetId: string,
  gasUrl: string,
  data: TimeEntry[],
  sheetName: string
): Promise<void> => {
  if (!spreadsheetId || !gasUrl || data.length === 0) return;

  // Helper to calculate totals to match UI
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      if (isNaN(sH) || isNaN(eH)) return 0;
      const startMin = sH * 60 + (sM || 0);
      const endMin = eH * 60 + (eM || 0);
      return Math.max(0, endMin - startMin);
    } catch {
      return 0;
    }
  };

  const formatTime = (min: number) => {
    if (min === 0) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  // Transform data to 2D array
  const values = data.map(row => {
    const p1 = calculateDuration(row.startTime1, row.endTime1);
    const p2 = calculateDuration(row.startTime2, row.endTime2);
    const total = formatTime(p1 + p2);
    
    return [
      row.date,
      row.startTime1,
      row.endTime1,
      row.startTime2,
      row.endTime2,
      total
    ];
  });

  // POST to GAS Web App
  // We send the detected name. If it's empty, we send "null" to let GAS handle the incrementing logic (e.g. null, null2)
  const targetSheet = sheetName || "null";

  await fetch(gasUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spreadsheetId: spreadsheetId,
      sheetName: targetSheet,
      values: values
    })
  });
};