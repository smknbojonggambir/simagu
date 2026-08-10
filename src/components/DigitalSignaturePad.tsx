import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Undo2, PenTool, Type, Upload } from 'lucide-react';

interface DigitalSignaturePadProps {
  initialSignature?: string;
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  title?: string;
  signerName?: string;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  initialSignature,
  onSave,
  onClear,
  title = 'Tanda Tangan Digital',
  signerName = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [penColor, setPenColor] = useState('#0f172a'); // slate-900 default
  const [penLineWidth, setPenLineWidth] = useState(2.5);
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedText, setTypedText] = useState(signerName);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high pixel ratio for smooth crisp drawing
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penLineWidth;

    if (initialSignature && initialSignature.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
        setHasSignature(true);
        saveState();
      };
      img.src = initialSignature;
    } else {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      saveState();
    }
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev.slice(-10), imageData]);
    } catch {
      // ignore
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penLineWidth;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setHistory([]);
    if (onClear) onClear();
  };

  const handleUndo = () => {
    if (history.length <= 1) {
      handleClear();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // remove current
    const prevState = newHistory[newHistory.length - 1];
    if (prevState) {
      ctx.putImageData(prevState, 0, 0);
      setHistory(newHistory);
    } else {
      handleClear();
    }
  };

  const generateTypedSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor;
    ctx.font = 'italic bold 32px "Dancing Script", "Brush Script MT", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText || signerName || 'Tanda Tangan', canvas.offsetWidth / 2, canvas.offsetHeight / 2 - 10);

    // Decorative underline stroke
    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    const textWidth = ctx.measureText(typedText || signerName || 'Tanda Tangan').width;
    const startX = (canvas.offsetWidth - textWidth) / 2;
    const endX = startX + textWidth;
    const y = canvas.offsetHeight / 2 + 15;
    ctx.moveTo(startX - 10, y);
    ctx.quadraticCurveTo(startX + textWidth / 2, y + 8, endX + 15, y - 2);
    ctx.stroke();

    setHasSignature(true);
    saveState();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Center fit image
        const scale = Math.min((canvas.offsetWidth - 20) / img.width, (canvas.offsetHeight - 20) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.offsetWidth - w) / 2;
        const y = (canvas.offsetHeight - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        setHasSignature(true);
        saveState();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <PenTool className="h-4 w-4 text-teal-600" />
            <span>{title}</span>
          </h4>
          {signerName && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Atas Nama: <span className="font-semibold text-slate-700 dark:text-slate-300">{signerName}</span></p>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              mode === 'draw'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Gores Canvas
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              mode === 'type'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Teks Otomatis
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              mode === 'upload'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Unggah File
          </button>
        </div>
      </div>

      {mode === 'draw' && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Warna:</span>
            {[
              { color: '#0f172a', label: 'Hitam' },
              { color: '#1e3a8a', label: 'Biru Tua' },
              { color: '#0d9488', label: 'Teal' },
            ].map((item) => (
              <button
                key={item.color}
                type="button"
                onClick={() => setPenColor(item.color)}
                style={{ backgroundColor: item.color }}
                className={`h-5 w-5 rounded-full border-2 transition ${
                  penColor === item.color ? 'border-amber-400 scale-110 shadow-sm' : 'border-white dark:border-slate-800'
                }`}
                title={item.label}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Ketebalan:</span>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={penLineWidth}
              onChange={(e) => setPenLineWidth(parseFloat(e.target.value))}
              className="w-20 accent-teal-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {mode === 'type' && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Tulis nama untuk tanda tangan..."
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-xs bg-slate-50 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={generateTypedSignature}
            className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700"
          >
            <Type className="h-3.5 w-3.5" />
            <span>Terapkan</span>
          </button>
        </div>
      )}

      {mode === 'upload' && (
        <div className="flex items-center gap-2 text-xs">
          <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Upload className="h-4 w-4 text-teal-600" />
            <span>Pilih foto tanda tangan (PNG/JPG)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Canvas Box */}
      <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden shadow-inner touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 cursor-crosshair block"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
            Goreskan tanda tangan di area kotak ini
          </div>
        )}

        {/* Watermark Line */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-300 dark:border-slate-600 pointer-events-none" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Urungkan</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Bersihkan</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSaveSignature}
          disabled={!hasSignature}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700 disabled:opacity-40 transition"
        >
          <Check className="h-4 w-4" />
          <span>Gunakan Tanda Tangan</span>
        </button>
      </div>
    </div>
  );
};
