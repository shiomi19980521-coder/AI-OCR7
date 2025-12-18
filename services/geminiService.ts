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
        
        【重要：表の構造を認識してください】
        画像が「どのような列構成の表か」をまず判断し、適切なルールを適用してください。
        
        ■ パターンA：4つの時刻列がある表（一般的）
        構造: [日付] | [出勤] | [退勤/外出] | [再入/休憩戻] | [退勤]
        
        抽出ルール: **「見た目のグリッド」を厳密に守ってください**
        - 列の位置が重要です。印字がない中間列は必ず「空文字」としてください。
        - 決して数字を左に詰めないでください。
        
        使用する具体例（今回のケース）:
        - 行: "1土 8:55 (空白) (空白) 17:05"
        - 正解: startTime1="8:55", endTime1="", startTime2="", endTime2="17:05"
          (※真ん中の2つの欄が空白なので、endTime1とstartTime2は空)
        
        - 行: "6木 8:46 15:03 16:15 18:09"
        - 正解: startTime1="8:46", endTime1="15:03", startTime2="16:15", endTime2="18:09"
        
        ■ パターンB：2つの時刻列しかない表（シンプル）
        構造: [日付] | [出勤] | [退勤]
        
        抽出ルール:
        - startTime1, endTime1 にのみデータを入れてください。
        - startTime2, endTime2 は空文字です。
        
        【出力データの定義】
        1. **列1 (Date)**: 日付と曜日
        2. **列2 (Start1)**: 出勤（1回目の打刻）
        3. **列3 (End1)**: 退勤（2回目の打刻）
           ※パターンAでここが空白なら空文字にする
        4. **列4 (Start2)**: 休憩戻り（3回目の打刻）
           ※パターンAでここが空白なら空文字にする
        5. **列5 (End2)**: 最終退勤（4回目の打刻）
        
        【合計時間 (totalHours)】
        - 画像内に「時数」や「合計」の列があり、数値が読み取れる場合は、その数値を優先して使用してください（例: "8:10" → 8.16）。
        - 読み取れない場合は、抽出した時刻から計算してください:
          (endTime1 - startTime1) + (endTime2 - startTime2)
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

      // -----------------------------------------------------------------------
      // ROBUST WEEKDAY LOGIC: Majority Voting Strategy
      // -----------------------------------------------------------------------
      // Instead of trusting the first weekday, we check ALL rows.
      // We calculate what the "offset" would be for each row if its weekday was correct.
      // Then we pick the most common offset (the "consensus").

      const offsetCounts: { [key: number]: number } = {};

      data.forEach(d => {
        if (d.dayInt && d.dayOfWeek) {
          const cleanDow = d.dayOfWeek.replace(/[()]/g, '');
          const dowIndex = WEEKDAYS.indexOf(cleanDow);
          if (dowIndex !== -1) {
            // Calculate offset: (DayOfWeekIndex - DayOfMonth + 700) % 7
            // Adding 700 to ensure positive result before modulo
            const offset = (dowIndex - (d.dayInt % 7) + 700) % 7;
            offsetCounts[offset] = (offsetCounts[offset] || 0) + 1;
          }
        }
      });

      // Find the most frequent offset (Mode)
      let bestOffset = -1;
      let maxCount = 0;

      Object.entries(offsetCounts).forEach(([offsetStr, count]) => {
        const countNum = count as number;
        if (countNum > maxCount) {
          maxCount = countNum;
          bestOffset = parseInt(offsetStr);
        }
      });

      console.log("[DEBUG] Weekday Offset Counts:", offsetCounts);
      console.log("[DEBUG] Best Offset Selected:", bestOffset, "with votes:", maxCount);

      // -----------------------------------------------------------------------

      let currentDay = startDay;

      while (currentDay <= lastDay) {
        let entry = data.find(d => d.dayInt === currentDay);

        let calculatedDow = '';
        if (bestOffset !== -1) {
          calculatedDow = WEEKDAYS[(currentDay + bestOffset) % 7];
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
        } else {
          // Override with consensus weekday if available
          if (calculatedDow) {
            entry.dayOfWeek = calculatedDow;
          }
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