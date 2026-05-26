import React, { useState, useRef } from 'react';
import { Category, Difficulty, QuestionStatus } from '../types';
import { db } from '../lib/db';
import {
  X, Upload, Download, AlertCircle, CheckCircle2,
  RefreshCw, FileSpreadsheet, FileText, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';
import { trackEvent } from '../lib/analytics';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

interface ParsedRow {
  rawRowNumber: number;
  question: string;
  categoryName: string;
  difficulty: Difficulty;
  tags: string[];
  url1?: string;
  url2?: string;
  status: QuestionStatus;
  isValid: boolean;
  errors: string[];
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [parsing, setParsing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'xlsx' && extension !== 'xls') {
      toast.error('Unsupported file format. Please upload either an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFileName(file.name);
    setParsing(true);
    setParsedData([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook;
        if (extension === 'csv') {
          workbook = XLSX.read(data, { type: 'string', codepage: 65001 });
        } else {
          workbook = XLSX.read(data, { type: 'binary' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse raw rows (we want strings for all columns to avoid scientific notations bugs)
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '', raw: false });

        const parsed: ParsedRow[] = [];

        rawRows.forEach((row: any, i: number) => {
          // Normalize column headers to support both cases and common spacing
          const findValue = (keys: string[]): string => {
            for (const key of keys) {
              if (row[key] !== undefined) return String(row[key]).trim();

              // Case-insensitive key check fallback
              const matchingKey = Object.keys(row).find(
                k => k.toLowerCase().replace(/\s/g, '') === key.toLowerCase().replace(/\s/g, '')
              );
              if (matchingKey !== undefined) return String(row[matchingKey]).trim();
            }
            return '';
          };

          const questionText = findValue(['Question', 'question', 'Prompt', 'prompt', 'Question Prompt']);
          const categoryName = findValue(['Category', 'category', 'Category Name']);
          let difficulty = findValue(['Difficulty', 'difficulty', 'Tier']);
          const tagsRaw = findValue(['Tags', 'tags', 'Keywords']);
          const url1 = findValue(['URL 1', 'url_1', 'Url 1', 'url1', 'Hint 1']);
          const url2 = findValue(['URL 2', 'url_2', 'Url 2', 'url2', 'Hint 2']);
          let status = findValue(['Status', 'status', 'Publish Status']);

          const errors: string[] = [];

          // Validation check: Question Prompt
          if (!questionText) {
            errors.push('Question prompt is blank.');
          } else if (questionText.length < 10) {
            errors.push('Question prompt is too short. Recommend min 10 characters.');
          }

          // Validation check: Category
          if (!categoryName) {
            errors.push('Category column assignment is missing.');
          }

          // Validation check: Difficulty
          let finalDiff: Difficulty = 'Medium';
          if (difficulty) {
            const normalizedDiff = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
            if (normalizedDiff === 'Easy' || normalizedDiff === 'Medium' || normalizedDiff === 'Hard') {
              finalDiff = normalizedDiff as Difficulty;
            } else {
              errors.push(`Invalid difficulty level "${difficulty}". Standardizer defaulting to Medium (Allowed: Easy, Medium, Hard).`);
            }
          }

          // Validation check: Status
          let finalStatus: QuestionStatus = 'Published';
          if (status) {
            const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            if (normalizedStatus === 'Published' || normalizedStatus === 'Draft') {
              finalStatus = normalizedStatus as QuestionStatus;
            } else {
              errors.push(`Invalid status style "${status}". Standardizer defaulting to Published (Allowed: Published, Draft).`);
            }
          }

          // Parse tag lists
          let tags: string[] = [];
          if (tagsRaw) {
            tags = tagsRaw.split(',')
              .map(t => t.trim().toLowerCase())
              .filter(t => t.length > 0);
          }

          parsed.push({
            rawRowNumber: i + 2, // 1-based index (Header is row 1)
            question: questionText,
            categoryName,
            difficulty: finalDiff,
            tags,
            url1: url1 || undefined,
            url2: url2 || undefined,
            status: finalStatus,
            isValid: errors.length === 0,
            errors
          });
        });

        setParsedData(parsed);

        const okRows = parsed.filter(p => p.isValid).length;
        const badRows = parsed.length - okRows;

        if (parsed.length === 0) {
          toast.error('The uploaded file does not contain any questions data rows.');
        } else if (badRows > 0) {
          toast.error(`Loaded file with rules violations: ${okRows} questions ready, ${badRows} require corrections.`);
        } else {
          toast.success(`Successfully validated ${okRows} questions! Ready for import.`);
        }
      } catch (err) {
        toast.error('Failed to parse database table sheet. Verify column names.');
        console.error(err);
      } finally {
        setParsing(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed reading the local file buffer.');
      setParsing(false);
    };

    if (extension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const downloadXlsxTemplate = () => {
    // Generate .xlsx on-the-fly dynamically
    const data = [
      {
        "Question": "How many electric cars are registered in Germany?",
        "Category": "Fermi Estimate",
        "Difficulty": "Medium",
        "Tags": "ev, transportation, germany, cars",
        "URL 1": "https://en.wikipedia.org/wiki/Electric_car",
        "URL 2": "https://www.kba.de",
        "Status": "Published"
      },
      {
        "Question": "How many slices of pizza are eaten in the USA every day?",
        "Category": "Market Sizing",
        "Difficulty": "Easy",
        "Tags": "food, consumer, pizza, us",
        "URL 1": "https://en.wikipedia.org/wiki/Pizza_in_the_United_States",
        "URL 2": "",
        "Status": "Draft"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions Template");
    XLSX.writeFile(wb, "guesstimates_bulk_template.xlsx");
    toast.success('Excel Template downloaded!');
    trackEvent('download_xlsx_template', 'bulk_upload');
  };

  const downloadCsvTemplate = () => {
    const csvContent = [
      ["Question", "Category", "Difficulty", "Tags", "URL 1", "URL 2", "Status"],
      ["How many electric cars are registered in Germany?", "Fermi Estimate", "Medium", "ev, transportation, germany, cars", "https://en.wikipedia.org/wiki/Electric_car", "https://www.kba.de", "Published"],
      ["How many slices of pizza are eaten in the USA every day?", "Market Sizing", "Easy", "food, consumer, pizza, us", "https://en.wikipedia.org/wiki/Pizza_in_the_United_States", "", "Draft"]
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "guesstimates_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Template downloaded!');
    trackEvent('download_csv_template', 'bulk_upload');
  };

  const handleBulkUploadSubmit = async () => {
    const validRows = parsedData.filter(p => p.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows found to upload to the database.');
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      // 1. Grab current categories & build map to check references
      const currentCats = await db.getCategories();
      const catMap = new Map<string, string>(); // name (lowercase) -> id
      currentCats.forEach(c => {
        catMap.set(c.name.toLowerCase(), c.id);
      });

      // 2. Pre-extract new category strings that require creation
      const uniqueNewCatNames: string[] = Array.from(
        new Set(
          validRows
            .map(r => r.categoryName.trim())
            .filter(name => name.length > 0 && !catMap.has(name.toLowerCase()))
        )
      ) as string[];

      // 3. Sequential dynamic category creation
      for (const newCatName of uniqueNewCatNames) {
        try {
          const created = await db.addCategory(newCatName);
          catMap.set(newCatName.toLowerCase(), created.id);
        } catch (catErr: any) {
          console.error(`Dynamic category creation error for: "${newCatName}"`, catErr);
        }
      }

      // 4. Sequential Question insertion
      for (const row of validRows) {
        const catId = catMap.get(row.categoryName.toLowerCase());
        if (!catId) continue;

        const payload = {
          question: row.question,
          category_id: catId,
          difficulty: row.difficulty,
          tags: row.tags,
          url_1: row.url1,
          url_2: row.url2,
          status: row.status
        };

        try {
          await db.addQuestion(payload);
          successCount++;
        } catch (qErr: any) {
          console.error(`Sequential insert raw failed at row ${row.rawRowNumber}`, qErr);
        }
      }

      toast.success(`Success: Successfully uploaded ${successCount} questions into Guesstimates!`);
      trackEvent('bulk_upload_success', 'bulk_upload', `${successCount} items`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during bulk operations.');
      trackEvent('bulk_upload_error', 'bulk_upload', err.message || 'unknown error');
    } finally {
      setUploading(false);
    }
  };

  const handleResetFile = () => {
    setFileName('');
    setParsedData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalDetected = parsedData.length;
  const validRowsCount = parsedData.filter(p => p.isValid).length;
  const invalidRowsCount = totalDetected - validRowsCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border transition-all duration-300 ${isLight ? 'bg-white text-zinc-800 border-zinc-200' : 'bg-bg-card text-zinc-300 border-zinc-600'
        }`}>

        {/* Header bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${isLight ? 'border-zinc-200' : 'border-zinc-800/80 bg-bg-canvas'
          }`}>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={`w-5 h-5 ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`} />
            <span className={`font-serif italic font-bold text-lg ${isLight ? 'text-[#1A2E6C]' : 'text-zinc-100'}`}>
              Bulk Upload Questions
            </span>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors cursor-pointer ${isLight ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div className="grow overflow-y-auto p-6 flex flex-col gap-5">

          {/* Instructions and templates */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/30 border-zinc-850'
            }`}>
            <div className="text-xs space-y-1.5 grow">
              <p className={`font-bold uppercase tracking-wider font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Standard CSV / Excel File Rules
              </p>
              <ul className={`list-decimal list-inside space-y-1 ${isLight ? 'text-zinc-650' : 'text-zinc-400'}`}>
                <li>Headers must include: <strong className="font-mono">Question</strong>, <strong className="font-mono">Category</strong>, <strong className="font-mono">Difficulty</strong>, and <strong className="font-mono">Tags</strong></li>
                <li>Difficulty tier allowed options: <strong className="font-mono">Easy</strong>, <strong className="font-mono">Medium</strong>, or <strong className="font-mono">Hard</strong></li>
                <li>Multiple tags should be separated by a comma (e.g. <em className="font-mono">nyc, retail, food</em>)</li>
                <li>Missing category names are auto-registered and dynamically inserted into the platform database</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={downloadXlsxTemplate}
                className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${isLight
                  ? 'bg-white border-zinc-250 hover:bg-zinc-50 hover:border-zinc-350 text-zinc-700'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                  }`}
              >
                <Download size={13} />
                <span>Excel Layout Template</span>
              </button>

              <button
                type="button"
                onClick={downloadCsvTemplate}
                className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${isLight
                  ? 'bg-white border-zinc-250 hover:bg-zinc-50 hover:border-zinc-350 text-zinc-700'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                  }`}
              >
                <Download size={13} />
                <span>CSV Layout Template</span>
              </button>
            </div>
          </div>

          {/* Drag & Dropzone area */}
          {!fileName ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${dragActive
                ? (isLight ? 'border-zinc-905 bg-zinc-100/60' : 'border-white bg-zinc-900/60')
                : (isLight ? 'border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-400' : 'border-zinc-600 bg-bg-card/30 hover:border-zinc-500 hover:bg-bg-canvas/30')
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <div className={`p-4 rounded-full border ${isLight ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                <Upload size={24} className={parsing ? "animate-bounce" : ""} />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                  {parsing ? "Analyzing file layout..." : "Upload questions file table"}
                </p>
                <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-450'}`}>
                  Drag and drop Excel (.xlsx, .xls) or Comma Separated (.csv) here, or browse files
                </p>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${isLight ? 'bg-zinc-50 border-zinc-205' : 'bg-bg-card border-zinc-850'
              }`}>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className={`p-2.5 rounded-lg ${isLight ? 'bg-white text-zinc-800 border border-zinc-200' : 'bg-zinc-900 text-zinc-100 border border-zinc-850'}`}>
                  {fileName.toLowerCase().endsWith('.csv') ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
                </div>
                <div className="truncate text-left">
                  <p className={`text-sm font-semibold truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>{fileName}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                    {totalDetected} Rows Read
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleResetFile}
                  className={`py-2 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isLight
                    ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                >
                  Change File
                </button>
              </div>
            </div>
          )}

          {/* Table Preview Area */}
          {totalDetected > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-500">
                  Import Preview Validation Breakdown
                </span>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 size={13} />
                    <span>{validRowsCount} Ready</span>
                  </span>
                  {invalidRowsCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500 font-semibold">
                      <AlertCircle size={13} />
                      <span>{invalidRowsCount} Discarded</span>
                    </span>
                  )}
                </div>
              </div>

              <div className={`border rounded-xl overflow-hidden max-h-56 overflow-y-auto ${isLight ? 'border-zinc-200' : 'border-zinc-850'
                }`}>
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className={`sticky top-0 z-10 font-bold uppercase font-mono ${isLight ? 'bg-zinc-100 text-zinc-500 border-b border-zinc-200' : 'bg-bg-card text-zinc-500 border-b border-zinc-850'
                    }`}>
                    <tr>
                      <th className="px-4 py-2.5 text-center">Row</th>
                      <th className="px-4 py-2.5">Question</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-center">Difficulty</th>
                      <th className="px-4 py-2.5 text-center">Tags</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5">Validation</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-zinc-150 text-zinc-700' : 'divide-zinc-900 text-zinc-350'
                    }`}>
                    {parsedData.map((row, index) => (
                      <tr
                        key={index}
                        className={`${!row.isValid ? (isLight ? 'bg-red-50/45' : 'bg-red-950/10') : ''} ${isLight ? 'hover:bg-zinc-50/70' : 'hover:bg-zinc-900/40'}`}
                      >
                        <td className="px-4 py-2 text-center font-mono font-semibold text-zinc-500">{row.rawRowNumber}</td>
                        <td className="px-4 py-2 max-w-50 truncate font-sans" title={row.question}>
                          {row.question || <span className="text-red-500 font-mono italic">Prompt Field Empty</span>}
                        </td>
                        <td className="px-4 py-2 truncate font-sans max-w-30" title={row.categoryName}>
                          {row.categoryName || <span className="text-red-500 font-mono italic">Missing Category</span>}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${row.difficulty === 'Easy'
                            ? (isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400')
                            : row.difficulty === 'Medium'
                              ? (isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/10 text-amber-400')
                              : (isLight ? 'bg-red-50 text-red-700' : 'bg-red-500/10 text-red-400')
                            }`}>
                            {row.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-2 max-w-30 truncate font-mono text-zinc-500 text-[10px]" title={row.tags.join(', ')}>
                          {row.tags.length > 0 ? row.tags.join(',') : '-'}
                        </td>
                        <td className="px-4 py-2 text-left">
                          <span className="font-mono text-[10px] font-bold">{row.status}</span>
                        </td>
                        <td className="px-4 py-2 font-mono text-[10px]">
                          {row.isValid ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                              <CheckCircle2 size={11} /> Pass
                            </span>
                          ) : (
                            <span className="text-red-500 font-semibold flex flex-col gap-0.5 whitespace-normal leading-tight">
                              {row.errors.map((err, errIndex) => (
                                <span key={errIndex}>• {err}</span>
                              ))}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-t transition-colors duration-300 ${isLight ? 'bg-[#F4F6FA] border-[#E5E7EB]' : 'bg-bg-canvas border-zinc-800'
          }`}>
          <div className="text-xs text-zinc-500">
            {validRowsCount > 0 && (
              <span>Ready to write <strong className="font-mono text-zinc-700 dark:text-zinc-300">{validRowsCount}</strong> records</span>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              disabled={uploading}
              onClick={onClose}
              className={`border font-bold py-2 px-5 rounded-lg text-sm transition-all cursor-pointer ${isLight
                ? 'bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-100'
                : 'bg-zinc-900 border border-zinc-805 hover:bg-zinc-800 text-zinc-30s text-zinc-300'
                }`}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={uploading || validRowsCount === 0}
              onClick={handleBulkUploadSubmit}
              className={`font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${isLight
                ? 'bg-zinc-900 hover:bg-zinc-850 text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
                }`}
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inserting...</span>
                </>
              ) : (
                <>
                  <ChevronRight size={14} strokeWidth={2.5} />
                  <span>Confirm Qs ({validRowsCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
