import React from 'react';
import { ASSETS } from '../data/gameData';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'LOADING YOUR FESTIVAL...',
  subMessage = 'Restoring your divine journey...',
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#140120] text-[#fff9ef] px-6 select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,#3a0e4f_0%,#180126_60%,#0e0017_100%)]" />

      <div className="relative z-10 flex flex-col items-center max-w-[360px] text-center">
        {/* Animated Ganesha Logo / Diya */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#3a1d4a] to-[#250d32] border-2 border-[#ffdb3c]/50 flex items-center justify-center shadow-[0_0_40px_rgba(255,219,60,0.35)] animate-pulse">
            <img
              src={ASSETS.logo}
              alt="Modak Mahayudh"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_10px_rgba(255,219,60,0.6)]"
            />
          </div>
          {/* Floating Diya indicator */}
          <div className="absolute -bottom-2 -right-2 bg-[#ff6f00] text-white p-2 rounded-full shadow-[0_0_15px_#ffdb3c] animate-bounce">
            <span className="text-sm">🪔</span>
          </div>
        </div>

        {/* Shloka invocation */}
        <div className="mb-4">
          <span className="font-display text-[11px] sm:text-[12px] text-[#ffb691] tracking-widest uppercase font-bold drop-shadow">
            ॥ श्री गणेशाय नमः ॥
          </span>
          <h1 className="font-display text-[18px] sm:text-[22px] font-black text-[#ffdb3c] mt-1 tracking-tight leading-tight drop-shadow">
            {message}
          </h1>
          <p className="font-body text-[13px] sm:text-[14px] text-[#e1bfb0] mt-1">
            {subMessage}
          </p>
        </div>

        {/* Golden Progress Bar */}
        <div className="w-48 h-2 bg-[#2b0e3b] rounded-full overflow-hidden border border-[#ffdb3c]/30 shadow-inner p-0.5">
          <div className="h-full bg-gradient-to-r from-[#ff6f00] via-[#ffdb3c] to-[#ffe16d] rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-full" />
        </div>

        <span className="font-body text-[10px] text-[#ffb691]/80 mt-3 italic">
          वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ • निर्विघ्नं कुरु मे देव
        </span>
      </div>
    </div>
  );
};
