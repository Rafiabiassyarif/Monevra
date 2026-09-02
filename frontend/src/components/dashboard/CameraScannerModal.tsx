import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, Camera, ImagePlus, ScanLine } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CameraScannerModalProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraScannerModal({ onClose, onCapture }: CameraScannerModalProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(err.name === 'NotAllowedError' 
        ? (t('custom.scanErrCameraDenied') || 'Akses kamera ditolak. Izinkan akses kamera di browser Anda.')
        : (t('custom.scanErrCameraFailed') || 'Gagal mengakses kamera. Pastikan perangkat Anda memiliki kamera.'));
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      onCapture(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Blurred Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-bg-dark/90 backdrop-blur-xl" 
        onClick={() => { stopCamera(); onClose(); }} 
      />
      
      {/* Main Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        className="w-full max-w-sm relative z-10 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-brand-500/20 text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <ScanLine size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide">{t('custom.modalScanAI') || 'Scan AI'}</h2>
              <p className="text-slate-400 text-xs">{t('custom.scanPositionReceipt') || 'Posisikan struk dalam area'}</p>
            </div>
          </div>
          <button 
            onClick={() => { stopCamera(); onClose(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-hover text-slate-400 hover:text-white hover:bg-border-dark transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative w-full aspect-[3/4] bg-surface-dark border-2 border-border-dark rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-500/10">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <Camera size={32} />
              </div>
              <p className="text-slate-300 text-sm mb-6">{error}</p>
              <button 
                onClick={startCamera}
                className="px-6 py-3 bg-white text-bg-dark font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                {t('custom.scanTryAgain') || 'Coba Lagi'}
              </button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Corner Brackets */}
              <div className="absolute inset-6 pointer-events-none">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white/80 rounded-tl-xl shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white/80 rounded-tr-xl shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white/80 rounded-bl-xl shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white/80 rounded-br-xl shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
              </div>

              {/* Scanning Laser Animation */}
              {isReady && (
                <motion.div 
                  className="absolute left-4 right-4 h-0.5 bg-brand-400 shadow-[0_0_15px_#3b82f6]"
                  animate={{ top: ['15%', '85%', '15%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-slate-300 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-all shadow-lg"
            >
              <ImagePlus size={20} />
            </button>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t('custom.scanGallery') || 'Galeri'}</span>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleGallerySelect} className="hidden" />
          </div>
          
          <button 
            onClick={handleCapture}
            disabled={!!error || !isReady}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center group ${error || !isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="absolute inset-0 rounded-full border-[3px] border-white/30 group-hover:border-white/60 transition-colors" />
            <div className="w-[68px] h-[68px] rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:scale-95 group-active:scale-90 transition-transform flex items-center justify-center text-bg-dark">
              <Camera size={28} />
            </div>
          </button>
          
          <div className="flex flex-col items-center gap-2">
            {/* Dummy space for layout balance */}
            <div className="w-12 h-12" />
          </div>
        </div>

      </motion.div>
    </div>
  );
};

