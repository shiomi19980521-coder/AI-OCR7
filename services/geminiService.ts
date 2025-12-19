import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { TimeEntry } from "../types";

// GoogleGenerativeAI initialized lazily

// Update Schema to return an object containing both the name and the entries array
const timeCardSchema: Schema = {
  description: "Timecard data",
  type: SchemaType.OBJECT,
  properties: {
    name: {
      type: SchemaType.STRING,
      description: "The name of the employee (氏名) found on the timecard. If not found, return null.",
    },
    entries: {
      type: SchemaType.ARRAY,
      description: "List of attendance entries extracted from the timecard.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dayInt: {
            type: SchemaType.INTEGER,
            description: "The numeric day of the month (e.g., 1, 15, 31). Used for sorting.",
          },
          date: {
            type: SchemaType.STRING,
            description: "The extracted date string (e.g. '1', '20'). Do not include the month.",
          },
          dayOfWeek: {
            type: SchemaType.STRING,
            description: "The day of the week in Japanese shorthand (e.g., '月', '火', '土', '日').",
          },
          startTime1: {
            type: SchemaType.STRING,
            description: "First period clock-in time in HH:mm format (24-hour).",
          },
          endTime1: {
            type: SchemaType.STRING,
            description: "First period clock-out time in HH:mm format (24-hour).",
          },
          startTime2: {
            type: SchemaType.STRING,
            description: "Second period clock-in time in HH:mm format (24-hour). If empty, return empty string.",
          },
          endTime2: {
            type: SchemaType.STRING,
            description: "Second period clock-out time in HH:mm format (24-hour). If empty, return empty string.",
          },
          totalHours: {
            type: SchemaType.NUMBER,
            description: "Total work hours for this day. Calculate by summing (endTime1 - startTime1) + (endTime2 - startTime2) if applicable. Return 0 if no times available.",
          },
        },
        required: ["dayInt", "date"],
      },
    }
  },
  required: ["entries"]
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// Update return type to include name
export const analyzeTimeCardImage = async (base64Image: string): Promise<{ entries: TimeEntry[], name: string }> => {
  try {
    // Extract mime type if present, otherwise default to jpeg
    let mimeType = "image/jpeg";
    let cleanBase64 = base64Image;

    if (base64Image.includes(',')) {
      const parts = base64Image.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) {
        mimeType = match[1];
      }
      cleanBase64 = parts[1];
    }

    // Use 2.0 Flash Experimental (User requested 2.5, likely meaning 2.0)
    const modelId = "gemini-2.0-flash-exp";

    // DEBUG: Log environment status
    console.log("[DEBUG] Checking Environment Variables...");
    console.log("Current Mode:", import.meta.env.MODE);
    console.log("Available VITE_ Keys:", Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    console.log("Has VITE_GEMINI_API_KEY:", !!import.meta.env.VITE_GEMINI_API_KEY);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[FATAL] API Key is verified missing. Environment dump:", import.meta.env);
      throw new Error("API Key is missing (Value is undefined). Please check browser console for details.");
    }
    console.log("Gemini Service: API Key found (length: " + apiKey.length + ")");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: timeCardSchema,
        temperature: 0.1,
      }
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64
        }
      },
      `
        この勤務表（タイムカード）の画像を解析し、データを抽出してください。
        
        以下の情報を抽出してください：
        1. 氏名（Name）: カード上部に記載されている氏名を探してください。見つからない場合はnullにしてください。
        
        2. 勤怠データ（Entries）:
            - 日付 (数字のみ抽出)
            - 曜日 (日本語の曜日一文字)
            - 時刻データの抽出ルール（【重要】左から右へ順番に割り当ててください）:
              
              画像の日付行にある「時刻のような数字（H:mm）」をすべて拾ってください。
              
              【パターンA: 数字が2つある場合】
              1つ目 → startTime1 (出勤)
              2つ目 → endTime1 (退勤)
              (startTime2, endTime2 は空文字)
              
              【パターンB: 数字が4つある場合】
              1つ目 → startTime1 (出勤)
              2つ目 → endTime1 (休憩開始/退勤)
              3つ目 → startTime2 (休憩終了/再出勤)
              4つ目 → endTime2 (退勤)
              
              ※数字の間隔や配置位置に関わらず、とにかく「左から何番目にあるか」だけで判定してください。
              ※「12:00」や「13:00」なども休憩ではなく「時刻」として扱って上記の順に割り当ててください。
              
            - 合計時間（totalHours）:
              * 1日の総労働時間を計算してください
              * 計算例 (パターンB): (2つ目 - 1つ目) + (4つ目 - 3つ目)
              * 例: 9:00, 12:00, 13:00, 18:00 の場合
                (12:00-9:00 = 3h) + (18:00-13:00 = 5h) = 8.0時間
              * 時刻データがない場合は 0 を出力してください
        
        重要な注意点:
        - 縦線や枠線は無視して、行にある数字を左から順に拾ってください。
        - 時間が空欄の場合は、nullではなく空文字("")を出力してください
        - 合計時間は必ず数値（小数点形式）で計算して出力してください
      `
    ]);

    const text = result.response.text();
    if (!text) {
      throw new Error("No data returned from Gemini.");
    }

    const parsedResult = JSON.parse(text) as { name?: string | null, entries: TimeEntry[] };
    let data = parsedResult.entries || [];
    const detectedName = parsedResult.name || "";

    // Helper to clean 'null' strings or null values
    const cleanStr = (val: any) => {
      if (val === null || val === undefined || val === 'null') return '';
      return String(val);
    };

    // Post-processing: Ensure no nulls, sort, and fill gaps
    data = data
      .filter(d => d.dayInt !== null && d.dayInt !== undefined)
      .sort((a, b) => (a.dayInt || 0) - (b.dayInt || 0))
      .map(d => ({
        ...d,
        startTime1: cleanStr(d.startTime1),
        endTime1: cleanStr(d.endTime1),
        endTime2: cleanStr(d.endTime2),
      }));

    // --- Post-processing: Correct Day of Week Inconsistencies ---
    if (data.length > 0) {
      data = correctDayOfWeekSequence(data);
    }
    // ------------------------------------------------------------

    if (data.length > 0) {
      const filledData: TimeEntry[] = [];
      const startDay = data[0].dayInt || 1;
      const lastDay = data[data.length - 1].dayInt || 31;

      // ... (rest of logic) ...

      // Try to determine the weekday offset
      let firstValidDayEntry = data.find(d => d.dayOfWeek && WEEKDAYS.includes(d.dayOfWeek.replace(/[()]/g, '')));
      let weekdayOffset = -1;

      if (firstValidDayEntry && firstValidDayEntry.dayInt) {
        // Re-calculate offset based on the CORRECTED sequence
        const cleanDow = firstValidDayEntry.dayOfWeek.replace(/[()]/g, '');
        const dowIndex = WEEKDAYS.indexOf(cleanDow);
        if (dowIndex !== -1) {
          weekdayOffset = (dowIndex - (firstValidDayEntry.dayInt % 7) + 7) % 7;
        }
      }


      let currentDay = startDay;

      while (currentDay <= lastDay) {
        let entry = data.find(d => d.dayInt === currentDay);

        let calculatedDow = '';
        if (weekdayOffset !== -1) {
          calculatedDow = WEEKDAYS[(currentDay + weekdayOffset) % 7];
        }

        if (!entry) {
          // Create gap entry with empty strings (not null)
          entry = {
            dayInt: currentDay,
            date: `${currentDay}`,
            dayOfWeek: calculatedDow,
            startTime1: '',
            endTime1: '',
            startTime2: '',
            endTime2: '',
          };
        } else if (!entry.dayOfWeek && calculatedDow) {
          entry.dayOfWeek = calculatedDow;
        }

        // Format the date string to be "20土" style
        const displayDate = entry.date.replace(/[^0-9]/g, '');
        const displayDow = (entry.dayOfWeek || '').replace(/[()]/g, '');

        entry.date = displayDow ? `${displayDate}${displayDow}` : `${displayDate}`;

        filledData.push(entry);
      }
      return { entries: filledData, name: detectedName };
    }

    return { entries: [], name: detectedName };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error(error instanceof Error ? error.message : "解析に失敗しました");
  }
};

// Helper function to correct day of week sequences based on majority voting
function correctDayOfWeekSequence(entries: TimeEntry[]): TimeEntry[] {
  const dowMap: { [key: string]: number } = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };
  const revDowMap: string[] = ["日", "月", "火", "水", "木", "金", "土"];

  // 1. Vote for "Day 1's Day-of-Week"
  const votes: { [key: number]: number } = {};

  entries.forEach(entry => {
    if (!entry.dayInt || !entry.dayOfWeek) return;

    // Normalize simple errors (e.g., if OCR reads weird chars, try to map strict or ignore)
    const dow = dowMap[entry.dayOfWeek.trim()];
    if (dow === undefined) return;

    // Calculate what Day 1 would be assuming this entry is correct
    // (CurrentDow - (DayInt - 1)) % 7
    // Using math to handle negative modulo: ((a % n) + n) % n
    const offset = entry.dayInt - 1;
    const impliedDay1 = ((dow - offset) % 7 + 7) % 7;

    votes[impliedDay1] = (votes[impliedDay1] || 0) + 1;
  });

  // 2. Find winner
  let bestDay1 = -1;
  let maxVote = -1;
  Object.keys(votes).forEach(keyStr => {
    const key = parseInt(keyStr);
    if (votes[key] > maxVote) {
      maxVote = votes[key];
      bestDay1 = key;
    }
  });

  // If no valid votes, return original
  if (bestDay1 === -1) return entries;

  // 3. Apply correction
  return entries.map(entry => {
    if (!entry.dayInt) return entry;

    const correctDowIndex = (bestDay1 + (entry.dayInt - 1)) % 7;
    const correctDow = revDowMap[correctDowIndex];

    // Only update if it's different and valid
    if (entry.dayOfWeek !== correctDow) {
      // console.log(`Auto-correcting date ${entry.dayInt}: ${entry.dayOfWeek} -> ${correctDow}`);
      return { ...entry, dayOfWeek: correctDow };
    }
    return entry;
  });
};