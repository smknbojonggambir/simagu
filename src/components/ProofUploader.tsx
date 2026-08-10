import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  ExternalLink, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2, 
  FolderTree, 
  RefreshCw, 
  SwitchCamera,
  X,
  Eye,
  AlertTriangle,
  Loader2,
  Sparkles,
  Zap
} from 'lucide-react';
import { GoogleDriveFolderPickerModal } from './GoogleDriveFolderPickerModal';

interface ProofUploaderProps {
  fotoUrls?: string[];
  dokumenUrl?: string;
  driveFolderLink?: string;
  onChangePhotos?: (urls: string[]) => void;
  onChangeDocument?: (url: string) => void;
  onChangeDriveLink?: (url: string) => void;
  title?: string;
}

export const ProofUploader: React.FC<ProofUploaderProps> = ({
  fotoUrls = [],
  dokumenUrl = '',
  driveFolderLink = '',
  onChangePhotos,
  onChangeDocument,
  onChangeDriveLink,
  title = 'Foto Selfie & Dokumen Bukti Kehadiran'
}) => {
  const [activeTab, setActiveTab] = useState<'foto' | 'dokumen' | 'tautan'>('foto');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(true);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);

  // Preview modal for captured photos
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [inputDriveLink, setInputDriveLink] = useState(driveFolderLink);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

  // Stop all camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveStream(null);
    setIsCameraActive(false);
    setIsCameraLoading(false);
  }, []);

  // Clean up camera stream on unmount or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Check available camera devices
  useEffect(() => {
    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {
          setHasMultipleCameras(true); // fallback assumption
        });
    }
  }, []);

  // Bind video element to media stream whenever videoRef mounts or activeStream updates
  useEffect(() => {
    if (isCameraActive && activeStream && videoRef.current) {
      const videoEl = videoRef.current;
      videoEl.srcObject = activeStream;
      
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsCameraLoading(false);
          })
          .catch((err) => {
            console.warn('Video play interrupted:', err);
            setIsCameraLoading(false);
          });
      }
    }
  }, [isCameraActive, activeStream]);

  // Start Live Camera with robust fallbacks and explicit error handling
  const startCamera = async (overrideFacingMode?: 'user' | 'environment') => {
    setCameraError(null);
    setIsCameraLoading(true);
    const modeToUse = overrideFacingMode || facingMode;

    // First stop any running camera
    stopCamera();

    // Check mediaDevices support
    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsCameraLoading(false);
      setCameraError(
        'Kamera tidak didukung atau tidak diizinkan pada koneksi browser ini. Silakan gunakan tombol "Unggah Foto dari HP / Komputer".'
      );
      return;
    }

    try {
      let stream: MediaStream | null = null;

      // Attempt 1: Ideal constraints with specified facingMode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: modeToUse },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e1) {
        console.warn('Camera attempt 1 (ideal constraints) failed:', e1);
        // Attempt 2: Basic facingMode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: modeToUse },
            audio: false
          });
        } catch (e2) {
          console.warn('Camera attempt 2 (basic facingMode) failed:', e2);
          // Attempt 3: General video stream
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (stream) {
        mediaStreamRef.current = stream;
        setActiveStream(stream);
        setIsCameraActive(true);
      } else {
        throw new Error('Stream kamera kosong');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraLoading(false);
      setIsCameraActive(false);

      let msg = 'Gagal mengakses kamera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak. Mohon izinkan akses kamera pada pengaturan browser (site settings) HP atau Komputer Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Perangkat kamera tidak ditemukan pada HP atau Komputer Anda.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Kamera sedang digunakan oleh aplikasi/tab lain. Mohon tutup aplikasi lain lalu coba lagi.';
      } else if (err.name === 'OverconstrainedError') {
        msg = 'Perangkat tidak mendukung resolusi/posisi kamera yang diminta.';
      } else if (err.message) {
        msg += ` (${err.message})`;
      }

      setCameraError(msg);
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    if (width === 0 || height === 0) {
      setCameraError('Kamera belum siap, mohon tunggu sebentar.');
      return;
    }

    const canvas = document.createElement('canvas');
    // Limit max canvas width to 1280px for performance and memory optimization
    const maxDim = 1280;
    let targetWidth = width;
    let targetHeight = height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        targetWidth = maxDim;
        targetHeight = Math.round((height * maxDim) / width);
      } else {
        targetHeight = maxDim;
        targetWidth = Math.round((width * maxDim) / height);
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If selfie camera, flip canvas horizontally so the saved photo matches selfie orientation
    if (facingMode === 'user') {
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    
    // Compress camera capture to max 800px width/height and quality 0.65 JPEG (~35KB)
    const compMaxDim = 800;
    let finalW = targetWidth;
    let finalH = targetHeight;
    if (finalW > compMaxDim || finalH > compMaxDim) {
      if (finalW > finalH) {
        finalH = Math.round((finalH * compMaxDim) / finalW);
        finalW = compMaxDim;
      } else {
        finalW = Math.round((finalW * compMaxDim) / finalH);
        finalH = compMaxDim;
      }
    }
    const compCanvas = document.createElement('canvas');
    compCanvas.width = finalW;
    compCanvas.height = finalH;
    const compCtx = compCanvas.getContext('2d');
    if (compCtx) {
      compCtx.drawImage(canvas, 0, 0, finalW, finalH);
    }
    const dataUrl = (compCtx ? compCanvas : canvas).toDataURL('image/jpeg', 0.65);

    if (onChangePhotos) {
      onChangePhotos([...fotoUrls, dataUrl]);
    }

    // Flash animation effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    // Toast notice
    setCaptureNotice('Foto Selfie Berhasil Diambil!');
    setTimeout(() => setCaptureNotice(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'photo' && onChangePhotos) {
          // Compress uploaded image
          const img = new Image();
          img.onload = () => {
            const maxDim = 800;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const compressed = canvas.toDataURL('image/jpeg', 0.65);
              onChangePhotos([...fotoUrls, compressed]);
            } else {
              onChangePhotos([...fotoUrls, result]);
            }
            setCaptureNotice('Foto Berhasil Diunggah & Dioptimalkan!');
            setTimeout(() => setCaptureNotice(null), 3000);
          };
          img.onerror = () => {
            onChangePhotos([...fotoUrls, result]);
          };
          img.src = result;
        } else if (type === 'doc' && onChangeDocument) {
          onChangeDocument(result);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input value
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    if (onChangePhotos) {
      const updated = fotoUrls.filter((_, i) => i !== index);
      onChangePhotos(updated);
    }
  };

  const handleSaveDriveLink = () => {
    if (onChangeDriveLink) {
      onChangeDriveLink(inputDriveLink);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Camera className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>{title}</span>
        </h4>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('foto'); stopCamera(); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
              activeTab === 'foto'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Selfie / Foto ({fotoUrls.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('dokumen'); stopCamera(); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
              activeTab === 'dokumen'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dokumen {dokumenUrl ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('tautan'); stopCamera(); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
              activeTab === 'tautan'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tautan File / Drive {driveFolderLink ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Tab 1: Foto Selfie & Kamera */}
      {activeTab === 'foto' && (
        <div className="space-y-3">
          {captureNotice && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{captureNotice}</span>
            </div>
          )}

          {!isCameraActive ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-md transition"
              >
                <Camera className="h-4 w-4" />
                <span>Buka Kamera ({facingMode === 'user' ? 'Depan / Selfie' : 'Belakang'})</span>
              </button>

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Ganti ke Kamera Depan / Belakang"
              >
                <SwitchCamera className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Ubah Kamera</span>
              </button>

              <label className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-95 transition">
                <Upload className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Unggah Foto dari HP / PC</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'photo')}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-teal-500 bg-black shadow-xl">
                {/* Flash effect overlay */}
                {flashEffect && (
                  <div className="absolute inset-0 bg-white z-20 animate-pulse pointer-events-none" />
                )}

                {/* Loading spinner */}
                {isCameraLoading && (
                  <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center text-white gap-2">
                    <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                    <span className="text-xs font-semibold">Menyiapkan Kamera...</span>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-72 object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Status Overlay Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{facingMode === 'user' ? 'Kamera Depan (Selfie)' : 'Kamera Belakang'}</span>
                </div>

                {/* Top Actions */}
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition backdrop-blur-md"
                    title="Beralih Kamera Depan/Belakang"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </button>
                </div>

                {/* Bottom Capture Controls */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isCameraLoading}
                    className="flex items-center gap-2 rounded-full bg-teal-500 hover:bg-teal-600 active:scale-95 px-6 py-2.5 text-xs font-extrabold text-white shadow-xl transition disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4 animate-bounce" />
                    <span>Ambil Foto Selfie</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-full bg-rose-600/90 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white transition shadow-md"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium">
                Posisikan wajah/kegiatan KBM Anda dengan jelas, lalu tekan <strong>Ambil Foto Selfie</strong>.
              </p>
            </div>
          )}

          {cameraError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{cameraError}</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Anda tetap dapat menggunakan tombol <strong>"Unggah Foto dari HP / PC"</strong> di atas untuk mengambil foto secara langsung melalui kamera HP/laptop.
                </p>
              </div>
            </div>
          )}

          {/* Photo Gallery Grid */}
          {fotoUrls.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Foto Tersimpan ({fotoUrls.length}):
                </span>
                <span className="text-[10px] text-slate-500">Klik foto untuk melihat ukuran penuh</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {fotoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video shadow-2xs hover:shadow-md transition"
                  >
                    <img
                      src={url}
                      alt={`Bukti ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewPhotoUrl(url)}
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 pointer-events-none">
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(url)}
                        className="p-1.5 rounded-full bg-white/90 text-slate-900 pointer-events-auto hover:scale-105 transition"
                        title="Lihat ukuran penuh"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 hover:scale-105 transition shadow-sm z-10"
                      title="Hapus foto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold backdrop-blur-xs">
                      Selfie #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dokumen Pendukung */}
      {activeTab === 'dokumen' && (
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400 mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Unggah Dokumen Pendukung</span>
            <span className="text-[10px] text-slate-500">Format PDF, DOC, XLS, atau Gambar (Maks 10MB)</span>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, 'doc')}
              className="hidden"
            />
          </label>

          {dokumenUrl && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="font-semibold text-teal-900 dark:text-teal-200 truncate">
                  Dokumen Berhasil Terunggah
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={dokumenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-teal-700 dark:text-teal-300 font-bold hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Lihat
                </a>
                <button
                  type="button"
                  onClick={() => onChangeDocument && onChangeDocument('')}
                  className="text-rose-600 hover:text-rose-700 p-1"
                  title="Hapus dokumen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tautan File / Google Drive Link */}
      {activeTab === 'tautan' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tautan Google Drive / Cloud Link
              </label>
              <button
                type="button"
                onClick={() => setIsFolderPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/80 px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition shadow-2xs"
              >
                <FolderTree className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Pilih Folder Google Drive</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={inputDriveLink}
                  onChange={(e) => setInputDriveLink(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveDriveLink}
                className="flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs"
              >
                <span>Simpan Tautan</span>
              </button>
            </div>
          </div>

          {driveFolderLink && (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-7 w-7 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  Drive
                </div>
                <div className="truncate">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{driveFolderLink}</p>
                  <p className="text-[10px] text-slate-500">Tautan File Pendukung Aktif</p>
                </div>
              </div>

              <a
                href={driveFolderLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shrink-0 shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Buka Tautan</span>
              </a>
            </div>
          )}

          {/* Folder Picker Modal */}
          <GoogleDriveFolderPickerModal
            isOpen={isFolderPickerOpen}
            onClose={() => setIsFolderPickerOpen(false)}
            currentSelectedUrl={inputDriveLink}
            onSelectFolder={(url) => {
              setInputDriveLink(url);
              if (onChangeDriveLink) {
                onChangeDriveLink(url);
              }
            }}
          />
        </div>
      )}

      {/* Full Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950 text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-bold">Pratinjau Foto Bukti</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black min-h-[300px]">
              <img
                src={previewPhotoUrl}
                alt="Foto Selfie Bukti"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
