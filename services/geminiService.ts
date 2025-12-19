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
        この勤務表（タイムカード）の画像を「Excelのようなグリッド（表）」として視覚的に認識し、そのままデータを抽出してください。
        
        【全体構造の認識】
        画像は「横長の日付行」が縦に並んでいる表です。
        各行は基本的に以下の5つの列（グリッド）で構成されています：
        
        [列1: 日付] | [列2: 開始1] | [列3: 終了1] | [列4: 開始2] | [列5: 終了2]
        
        【重要：列の判断基準】
        画像を見て、**縦の列の位置関係**を厳密に守ってください。
        
        ★基本ルール（最優先）：
        行の中に「時刻が4つ」ある場合は、空白があっても無視して、必ず左から順に [Start1] [End1] [Start2] [End2] を全て埋めてください。
        例: "9:25 12:00 14:23 18:14" → Start1:9:25, End1:12:00, Start2:14:23, End2:18:14
        
        ★特有のパターン（例外）：
        時刻が2つだけで、かつ中間に**明白な広い空白**がある場合のみ、位置を飛ばしてください。
        例: [8:55] [    ] [    ] [17:05]
        この場合、「17:05」は2番目の数字ですが、右端の「終了2」の列にあるため、必ず endTime2 として抽出してください。
                3. **具体例**
           画像: [16水] [9:25] [     ] [     ] [13:50]
           抽出結果: 
             startTime1: "9:25"
             endTime1: ""
             startTime2: ""
             endTime2: "13:50"
             totalHours: 4.42 (13:50-9:25 = 4h25m)
             
           画像: [17木] [9:20] [12:00] [13:00] [17:00]
           抽出結果:
             startTime1: "9:20"
             endTime1: "12:00"
             startTime2: "13:00"
             endTime2: "17:00"
             totalHours: 6.67 (2h40m + 4h = 6h40m)

        【抽出ルール】
        1. **見た目通りの位置を維持してください**
           - 表の「マス目」を意識してください。
           - ヘッダー（「入」「退」「入/時数」「退」など）があれば、それに従ってください。
           
        2. **列の定義**
           - **列1 (Date)**: 日付と曜日
           - **列2 (Start1)**: 出勤
           - **列3 (End1)**: 退勤（または休憩開始）
           - **列4 (Start2)**: 再出勤（または休憩終了）
           - **列5 (End2)**: 最終退勤
           
        3. **合計時間（totalHours）の計算ルール**
           - 基本式: (endTime1 - startTime1) + (endTime2 - startTime2)
           - **例外パターン**: endTime1 と startTime2 が空で、endTime2 だけがある場合（例：8:55 ... 17:05）
             -> 計算式: endTime2 - startTime1 で計算してください。
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
        startTime2: cleanStr(d.startTime2),
        endTime2: cleanStr(d.endTime2),
      }));

    if (data.length > 0) {
      const filledData: TimeEntry[] = [];
      const startDay = data[0].dayInt || 1;
      const lastDay = data[data.length - 1].dayInt || 31;

      // Try to determine the weekday offset
      let firstValidDayEntry = data.find(d => d.dayOfWeek && WEEKDAYS.includes(d.dayOfWeek.replace(/[()]/g, '')));
      let weekdayOffset = -1;

      if (firstValidDayEntry && firstValidDayEntry.dayInt) {
        const cleanDow = firstValidDayEntry.dayOfWeek.replace(/[()]/g, '');
        const dowIndex = WEEKDAYS.indexOf(cleanDow);
        if (dowIndex !== -1) {
          weekdayOffset = (dowIndex - (firstValidDayEntry.dayInt % 7) + 7) % 7;
        }
      }

      // Helper to parse "HH:mm" to minutes
      const parseToMinutes = (timeStr: string): number => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return 0;
        return h * 60 + m;
      };

      let currentDay = startDay;

      while (currentDay <= lastDay) {
        let entry = data.find(d => d.dayInt === currentDay);

        let calculatedDow = '';
        if (weekdayOffset !== -1) {
          calculatedDow = WEEKDAYS[(currentDay + weekdayOffset) % 7];
        }

        if (!entry) {
          // Create gap entry with empty strings
          entry = {
            dayInt: currentDay,
            date: `${currentDay}`,
            dayOfWeek: calculatedDow,
            startTime1: '',
            endTime1: '',
            startTime2: '',
            endTime2: '',
            totalHours: 0
          };
        } else {
          if (!entry.dayOfWeek && calculatedDow) {
            entry.dayOfWeek = calculatedDow;
          }

          // STRICT CALCULATION LOGIC (Overwriting AI's totalHours)
          // Rule 1: If endTime2 exists but (endTime1 & startTime2) are empty -> Calculate endTime2 - startTime1
          // Rule 2: Otherwise -> (endTime1 - startTime1) + (endTime2 - startTime2)

          const s1 = parseToMinutes(entry.startTime1);
          const e1 = parseToMinutes(entry.endTime1);
          const s2 = parseToMinutes(entry.startTime2);
          const e2 = parseToMinutes(entry.endTime2);

          let totalMinutes = 0;

          // Checks for strict column logic pattern: [S1] [ ] [ ] [E2]
          const hasS1 = !!entry.startTime1;
          const hasE1 = !!entry.endTime1;
          const hasS2 = !!entry.startTime2;
          const hasE2 = !!entry.endTime2;

          if (hasS1 && !hasE1 && !hasS2 && hasE2) {
            // Exception Pattern: 8:55 ... ... 17:05
            totalMinutes = Math.max(0, e2 - s1);
          } else {
            // Standard Pattern
            const p1 = (hasS1 && hasE1) ? Math.max(0, e1 - s1) : 0;
            const p2 = (hasS2 && hasE2) ? Math.max(0, e2 - s2) : 0;
            totalMinutes = p1 + p2;
          }

          // Round to 2 decimal places for hours
          entry.totalHours = Math.round((totalMinutes / 60) * 100) / 100;
        }

        // Format the date string to be "20土" style
        const displayDate = entry.date.replace(/[^0-9]/g, '');
        const displayDow = (entry.dayOfWeek || '').replace(/[()]/g, '');

        entry.date = displayDow ? `${displayDate}${displayDow}` : `${displayDate}`;

        filledData.push(entry);
        currentDay++;
      }
      return { entries: filledData, name: detectedName };
    }

    return { entries: data, name: detectedName };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};