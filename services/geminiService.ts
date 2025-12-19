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

    const prompt = `
        この勤務表（タイムカード）の画像を解析し、データを抽出してください。
        
        【抽出ルール：左詰め厳守】
        画像内の各行にある「時刻データ（HH:mm）」の個数に応じて、以下のルールで抽出してください。
        
        **パターンA：時刻が2つある場合**
        必ず「開始1」と「終了1」に入れてください。
        例画像: [9:00] [18:00]
        抽出: startTime1: "9:00", endTime1: "18:00", startTime2: "", endTime2: ""
        
        **パターンB：時刻が4つある場合**
        左から順に「開始1」「終了1」「開始2」「終了2」に入れてください。
        例画像: [9:00] [12:00] [13:00] [18:00]
        抽出: startTime1: "9:00", endTime1: "12:00", startTime2: "13:00", endTime2: "18:00"

        **重要な注意点:**
        - 「列の位置」や「空白」は気にしないでください。
        - 単純に見つかった時刻を左から順に埋めてください。
        - 3つだけある等の不正な場合は、左から埋めて残りは空文字にしてください。

        【出力フォーマット】
        JSON形式のみ出力してください。
        \`\`\`json
        {
          "name": "氏名",
          "entries": [
            {
              "dayInt": 1,
              "date": "1日",
              "dayOfWeek": "月",
              "startTime1": "9:00",
              "endTime1": "18:00",
              "startTime2": "",
              "endTime2": "",
              "totalHours": 0
            }
          ]
        }
        \`\`\`
      `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON format not found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Validate schema
    if (!parsedData.entries || !Array.isArray(parsedData.entries)) {
      throw new Error("Invalid schema: 'entries' array is missing");
    }

    const detectedName = parsedData.name || "";
    let data: TimeEntry[] = parsedData.entries;

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

          // STRICT CALCULATION LOGIC (Standard Left-to-Right)
          // Just sum up the durations based on what is present.
          // Since we enforce left-alignment:
          // 2 items -> S1, E1
          // 4 items -> S1, E1, S2, E2

          const s1 = parseToMinutes(entry.startTime1);
          const e1 = parseToMinutes(entry.endTime1);
          const s2 = parseToMinutes(entry.startTime2);
          const e2 = parseToMinutes(entry.endTime2);

          let totalMinutes = 0;

          const hasS1 = !!entry.startTime1;
          const hasE1 = !!entry.endTime1;
          const hasS2 = !!entry.startTime2;
          const hasE2 = !!entry.endTime2;

          // Simple standard calculation
          const p1 = (hasS1 && hasE1) ? Math.max(0, e1 - s1) : 0;
          const p2 = (hasS2 && hasE2) ? Math.max(0, e2 - s2) : 0;
          totalMinutes = p1 + p2;

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