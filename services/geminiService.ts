import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { TimeEntry } from '../types';

// Use stable 1.5 Flash model
const modelId = "gemini-1.5-flash";

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const timeCardSchema = {
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
        },
        required: ["dayInt", "date"],
      },
    }
  },
  required: ["entries"]
} as const;

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

    // DEBUG: Log environment status
    console.log("[DEBUG] Checking Environment Variables...");
    console.log("Current Mode:", import.meta.env.MODE);
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
        この勤務表画像を「横5列の表（グリッド）」として視覚的に読み取ってください。
        
        【表の構造】
        [列1: 日付] [列2: 開始1] [列3: 終了1] [列4: 開始2] [列5: 終了2]
        
        【最重要ルール: 見た目の位置を絶対遵守】
        - 画像の「マス目」の位置をそのまま反映してください。
        - **数字がないマス（空白）は、必ず空文字 ("") を出力してください。**
        - **絶対に詰めてはいけません。**
        
        【例】
        - 画像で [列2] と [列5] だけに時刻がある場合
          → startTime1="9:00", endTime1="", startTime2="", endTime2="18:00"
        
        - 画像で [列2] [列3] [列4] [列5] 全てに時刻がある場合
          → 全てのフィールドを埋める
          
        - 画像で [列2] と [列3] だけに時刻がある場合
          → startTime1="9:00", endTime1="12:00", startTime2="", endTime2=""

        思考や解釈は不要です。人間が目で見て「この列は空いている」と判断する通りに、機械的に抽出してください。
      `
    ]);

    const text = result.response.text();
    if (!text) {
      throw new Error("No data returned from Gemini.");
    }

    const parsedResult = JSON.parse(text) as { name?: string | null, entries: any[] };
    let data = parsedResult.entries || [];
    const detectedName = parsedResult.name || "";

    // Helper to clean 'null' strings or null values
    const cleanStr = (val: any) => {
      if (val === null || val === undefined || val === 'null') return '';
      return String(val);
    };

    // Post-processing: Ensure no nulls, sort, and fill gaps
    let processedData: TimeEntry[] = data
      .filter(d => d.dayInt !== null && d.dayInt !== undefined)
      .sort((a, b) => (a.dayInt || 0) - (b.dayInt || 0))
      .map(d => ({
        dayInt: d.dayInt,
        date: String(d.date),
        dayOfWeek: d.dayOfWeek,
        startTime1: cleanStr(d.startTime1),
        endTime1: cleanStr(d.endTime1),
        startTime2: cleanStr(d.startTime2),
        endTime2: cleanStr(d.endTime2),
        totalHours: undefined // Will be calculated by UI or explicit prompt if needed
      }));

    if (processedData.length > 0) {
      const filledData: TimeEntry[] = [];
      const startDay = processedData[0].dayInt || 1;
      const lastDay = processedData[processedData.length - 1].dayInt || 31;

      // Try to determine the weekday offset
      let firstValidDayEntry = processedData.find(d => d.dayOfWeek && WEEKDAYS.includes(d.dayOfWeek.replace(/[()]/g, '')));
      let weekdayOffset = -1;

      if (firstValidDayEntry && firstValidDayEntry.dayInt) {
        const cleanDow = firstValidDayEntry.dayOfWeek.replace(/[()]/g, '');
        const dowIndex = WEEKDAYS.indexOf(cleanDow);
        if (dowIndex !== -1) {
          weekdayOffset = (dowIndex - (firstValidDayEntry.dayInt % 7) + 7) % 7;
        }
      }

      let currentDay = startDay;

      while (currentDay <= lastDay) {
        let entry = processedData.find(d => d.dayInt === currentDay);

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

        entry.date = displayDow ? `${displayDate}${displayDow}` : displayDate;

        filledData.push(entry);
        currentDay++;
      }
      return { entries: filledData, name: detectedName };
    }

    return { entries: processedData, name: detectedName };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};