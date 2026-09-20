import React, { useEffect } from 'react';
import { AppIcon } from './AppIcon';

interface ToastProps {
  message: string;
  icon?: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, icon = 'check_circle', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-[calc(4.5rem+max(env(safe-area-inset-top,0px),12px))] left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-32px)] sm:max-w-md w-auto animate-in slide-in-from-top-4 fade-in duration-200 pointer-events-none">
      <div className="bg-[#1c012d]/95 backdrop-blur-md border border-[#ffdb3c]/60 shadow-[0_10px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(255,219,60,0.3)] rounded-full px-4 py-2 flex items-center gap-2.5 text-white pointer-events-auto">
        <div className="w-6 h-6 rounded-full bg-[#ffdb3c]/20 flex items-center justify-center text-[#ffdb3c] shrink-0">
          <AppIcon name={icon} size={15} className="text-[#ffdb3c]" />
        </div>
        <span className="font-body text-[12px] font-bold text-[#fff9ef] whitespace-nowrap">
          {message}
        </span>
        <button
          onClick={onClose}
          className="ml-1 text-[#e1bfb0] hover:text-white cursor-pointer p-0.5"
        >
          <AppIcon name="close" size={13} />
        </button>
      </div>
    </div>
  );
};
