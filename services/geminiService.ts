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
        
        [列1: 日付] | [列2: 開始時間1] | [列3: 終了時間1] | [列4: 開始時間2] | [列5: 終了時間2]
        
        【抽出ルール】
        1. **見た目通りの位置を維持してください**
           - 表の「マス目」を意識してください。
           - 数字が印字されているマスは抽出してください。
           - **空白（印字がない）マスは、必ず空文字("")としてください。** 決して詰めてはいけません。
           
        2. **列の定義と学習パターン**
           画像は基本的に以下の5列構成です：
           [日付] | [出勤] | [退勤(or 休憩開始)] | [休憩戻り] | [最終退勤]
           
           **学習用実例（ユーザー提供パターン）:**
           
           例1: [1土] [8:55] [     ] [     ] [17:05]
           → Start1:"8:55", End1:"", Start2:"", End2:"17:05"
             (中抜けなしの標準的な勤務)
             
           例2: [3月] [8:48] [12:03] [13:29] [17:15]
           → Start1:"8:48", End1:"12:03", Start2:"13:29", End2:"17:15"
             (休憩ありのフル勤務)
             
           例3: [6木] [8:46] [15:03] [16:15] [4:07]
           → Start1:"8:46", End1:"15:03", Start2:"16:15", End2:"4:07"
             (翌朝までの深夜残業パターンを含む)
             
           例4: [12水] [10:03] [     ] [     ] [17:08]
           → Start1:"10:03", End1:"", Start2:"", End2:"17:08"
           
           例5: [14金] [8:52] [12:03] [13:40] [19:20]
           → Start1:"8:52", End1:"12:03", Start2:"13:40", End2:"19:20"

        【重要】
        - 「シ」や「テ」などの小さな文字（異常マーク）が付いていても、数字部分（時刻）のみを抽出してください。
        - 縦の列の位置関係を最優先してください。数字が左寄りにあっても、それが「3列目」の列にあればEnd1として扱ってください。
        - 4:07などの翌朝時刻もそのまま抽出してください。
        - 合計時間（totalHours）は抽出された時刻に基づいて計算してください。
        - 合計時間計算式: (endTime1 - startTime1) + (endTime2 - startTime2)
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