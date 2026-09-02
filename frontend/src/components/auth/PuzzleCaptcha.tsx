import React, { useState, useRef } from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface PuzzleCaptchaProps {
  onVerify: (token: string) => void;
}

export default function PuzzleCaptcha({ onVerify }: PuzzleCaptchaProps) {
  const { t } = useLanguage();
  const [isVerified, setIsVerified] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  // Calculate background color transition based on drag progress
  const background = useTransform(
    x,
    [0, 250], // Approximate max drag distance
    ['rgba(255, 255, 255, 0.02)', 'rgba(59, 130, 246, 0.3)']
  );

  const handleDragEnd = (event: any, info: any) => {
    // If dragged sufficiently far to the right
    if (info.offset.x > 180 || x.get() > 180) { 
      setIsVerified(true);
      // Snap to end
      animate(x, 250, { type: 'spring', stiffness: 400, damping: 25 });
      // Generate a dummy valid token for our own backend
      onVerify('monevra_custom_verified_token_' + Date.now());
    } else {
      // Snap back to start if not far enough
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 });
    }
  };

  return (
    <div className="w-full mx-auto my-6 relative group">
      <div 
        ref={containerRef}
        className="relative h-14 rounded-2xl border border-form-border bg-form-bg overflow-hidden backdrop-blur-md flex items-center shadow-inner"
      >
        {/* Dynamic progress background */}
        <motion.div 
          className="absolute left-0 top-0 bottom-0 pointer-events-none"
          style={{ width: useTransform(x, (val) => val + 48), background }}
        />
        
        {isVerified ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center gap-2 text-brand-400 font-semibold text-sm z-10 bg-brand-500/10 backdrop-blur-md"
          >
            <ShieldCheck className="w-5 h-5" />
            {t('auth.verifySuccess')}
          </motion.div>
        ) : (
          <>
            {/* Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-medium z-0 gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
              <ShieldAlert className="w-4 h-4" />
              {t('auth.slideVerify')}
            </div>
            
            {/* Draggable Handle */}
            <motion.div
              drag="x"
              dragConstraints={containerRef}
              dragElastic={0}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              style={{ x }}
              className="absolute left-1 top-1 bottom-1 w-12 bg-surface-dark rounded-xl border border-border-dark shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-grab active:cursor-grabbing z-20 hover:border-brand-400 transition-colors"
            >
              <div className="flex gap-[3px]">
                <div className="w-[2px] h-4 bg-slate-400 rounded-full" />
                <div className="w-[2px] h-4 bg-slate-400 rounded-full" />
                <div className="w-[2px] h-4 bg-slate-400 rounded-full" />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
