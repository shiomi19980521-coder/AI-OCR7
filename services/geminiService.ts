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
            - 時刻データの抽出ルール:
              
              【パターン1: 1日に2つの時刻がある場合】
              例: "16水 9:25 12:10"
              → startTime1: "9:25", endTime1: "12:10", startTime2: "", endTime2: ""
              
              【パターン2: 1日に4つの時刻がある場合】
              例: "16水 9:25 12:10 13:50 17:00"
              → startTime1: "9:25", endTime1: "12:10", startTime2: "13:50", endTime2: "17:00"
              
              時刻は必ず左から順番に:
              1番目 = startTime1 (出勤1)
              2番目 = endTime1 (退勤1)
              3番目 = startTime2 (出勤2、ない場合は空文字)
              4番目 = endTime2 (退勤2、ない場合は空文字)
              
            - 合計時間（totalHours）:
              * 1日の総労働時間を計算してください
              * 計算例: 
                - パターン1: (12:10 - 9:25) = 2.75時間
                - パターン2: (12:10 - 9:25) + (17:00 - 13:50) = 2.75 + 3.17 = 5.92時間
              * 時刻データがない場合は 0 を出力してください
        
        重要な注意点:
        - 日付の行は、画像に表示されている通りに抽出してください
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