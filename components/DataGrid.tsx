import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Save, FileSpreadsheet, FileText, User } from 'lucide-react';
import { TimeEntry } from '../types';

interface DataGridProps {
  data: TimeEntry[];
  detectedName?: string;
  fileName?: string;
}

export const DataGrid: React.FC<DataGridProps> = ({ data: initialData, detectedName, fileName }) => {
  const [data, setData] = useState(initialData);
  const [copied, setCopied] = useState(false);

  // Update local state if props change
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleCellChange = (index: number, field: keyof TimeEntry, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const calculateDurationMinutes = (start: string, end: string): number => {
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

  const formatTime = (totalMins: number): string => {
    if (totalMins === 0) return '';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    // Format: 6:26
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const getRowTotalMinutes = (row: TimeEntry): number => {
     const period1 = calculateDurationMinutes(row.startTime1, row.endTime1);
     const period2 = calculateDurationMinutes(row.startTime2, row.endTime2);
     return period1 + period2;
  };

  const calculateGrandTotal = (): string => {
    let totalMinutes = 0;
    data.forEach(row => {
      totalMinutes += getRowTotalMinutes(row);
    });
    return formatTime(totalMinutes);
  };

  const copyToClipboard = () => {
    // Rows
    const rows = data.map(row => {
      const total = formatTime(getRowTotalMinutes(row));
      // Add single quote to force text format in Excel (prevents seconds from appearing)
      // Columns: Date, Start1, End1, Start2, End2, Total
      return `${row.date}\t${row.startTime1}\t${row.endTime1}\t${row.startTime2}\t${row.endTime2}\t'${total}`;
    }).join("\n");
    
    // Add Grand Total row
    const grandTotal = calculateGrandTotal();
    const totalRow = `総合計時間\t\t\t\t\t'${grandTotal}`;
    
    navigator.clipboard.writeText(rows + "\n" + totalRow).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getDateStyle = (dateStr: string) => {
    if (dateStr.includes('日')) return 'text-red-600 bg-red-50/50 font-bold';
    if (dateStr.includes('土')) return 'text-blue-600 bg-blue-50/50 font-bold';
    return 'text-slate-700 font-medium';
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col mb-8 last:mb-0">
      {/* Toolbar */}
      <div className="px-4 md:px-6 py-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-green-100 p-2 rounded-lg">
               <FileSpreadsheet className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {detectedName ? detectedName : '抽出結果'}
              </h3>
              {fileName && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <FileText className="w-3 h-3" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            onClick={copyToClipboard}
            className={`
              flex-1 sm:flex-none justify-center flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm
              ${copied 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-transparent'
              }
            `}
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'コピー完了' : 'Excel用にコピー'}
          </button>
        </div>
      </div>
      
      {/* Table Container */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[600px]">
          <thead className="text-xs font-bold text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-2 py-3 border-b border-slate-200 w-1/6 text-center">日付</th>
              <th className="px-2 py-3 border-b border-slate-200 bg-indigo-50/30 text-indigo-900 w-1/6 text-center">開始1</th>
              <th className="px-2 py-3 border-b border-slate-200 bg-indigo-50/30 text-indigo-900 w-1/6 text-center">終了1</th>
              <th className="px-2 py-3 border-b border-slate-200 bg-orange-50/30 text-orange-900 w-1/6 text-center">開始2</th>
              <th className="px-2 py-3 border-b border-slate-200 bg-orange-50/30 text-orange-900 w-1/6 text-center">終了2</th>
              <th className="px-2 py-3 border-b border-slate-200 text-center w-1/6">合計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr key={index} className="group bg-white hover:bg-slate-50 transition-colors">
                <td className="px-1 py-1 md:px-2 border-r border-slate-100">
                  <input 
                    type="text" 
                    value={row.date}
                    onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                    className={`w-full bg-transparent border-none focus:ring-0 text-center p-0 text-xs md:text-sm ${getDateStyle(row.date)}`}
                  />
                </td>
                
                {/* Set 1 */}
                <td className="px-1 py-1 md:px-2 bg-indigo-50/10 group-hover:bg-indigo-50/30 border-r border-slate-100">
                  <input 
                    type="text" 
                    value={row.startTime1}
                    placeholder=""
                    onChange={(e) => handleCellChange(index, 'startTime1', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-600 text-center font-mono focus:text-indigo-600 focus:font-bold p-0 text-xs md:text-sm"
                  />
                </td>
                <td className="px-1 py-1 md:px-2 bg-indigo-50/10 group-hover:bg-indigo-50/30 border-r border-indigo-100">
                   <input 
                    type="text" 
                    value={row.endTime1}
                    placeholder=""
                    onChange={(e) => handleCellChange(index, 'endTime1', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-600 text-center font-mono focus:text-indigo-600 focus:font-bold p-0 text-xs md:text-sm"
                  />
                </td>

                {/* Set 2 */}
                <td className="px-1 py-1 md:px-2 bg-orange-50/10 group-hover:bg-orange-50/30 border-r border-slate-100">
                   <input 
                    type="text" 
                    value={row.startTime2}
                    placeholder=""
                    onChange={(e) => handleCellChange(index, 'startTime2', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-500 text-center font-mono focus:text-orange-600 focus:font-bold p-0 text-xs md:text-sm"
                  />
                </td>
                <td className="px-1 py-1 md:px-2 bg-orange-50/10 group-hover:bg-orange-50/30 border-r border-slate-100">
                   <input 
                    type="text" 
                    value={row.endTime2}
                    placeholder=""
                    onChange={(e) => handleCellChange(index, 'endTime2', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-500 text-center font-mono focus:text-orange-600 focus:font-bold p-0 text-xs md:text-sm"
                  />
                </td>

                {/* Calculations */}
                <td className="px-1 py-1 md:px-4 md:py-2 text-center font-mono text-slate-800 font-medium bg-slate-50/50 border-r border-slate-100 text-xs md:text-sm">
                   {formatTime(getRowTotalMinutes(row))}
                </td>
              </tr>
            ))}
            {/* Grand Total Row */}
             {data.length > 0 && (
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td colSpan={5} className="px-4 py-3 text-right text-slate-600 uppercase tracking-wider text-xs hidden md:table-cell">
                  総合計時間
                </td>
                 <td colSpan={5} className="px-2 py-3 text-right text-slate-600 uppercase tracking-wider text-[10px] md:hidden">
                  合計
                </td>
                <td className="px-2 py-3 md:px-4 text-center font-mono text-indigo-700 text-sm md:text-base border-l border-slate-200 bg-indigo-50/50">
                  {calculateGrandTotal()}
                </td>
              </tr>
            )}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/30">
                  データがありません。画像をアップロードしてください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-50 px-4 md:px-6 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span className="font-medium">抽出行数: {data.length}</span>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
           <span className="hidden md:inline">クリックして編集可能</span>
        </div>
      </div>
    </div>
  );
};