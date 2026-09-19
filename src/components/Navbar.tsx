import React from 'react';
import { Screen } from '../types';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface NavbarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  soundEnabled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate, soundEnabled }) => {
  const navItems: { screen: Screen; label: string; icon: string; badge?: string }[] = [
    { screen: 'home', label: 'Home', icon: 'cottage' },
    { screen: 'map', label: 'Levels', icon: 'map' },
    { screen: 'powers', label: 'Powers', icon: 'auto_awesome' },
    { screen: 'ranks', label: 'Ranks', icon: 'emoji_events' },
    { screen: 'rewards', label: 'Rewards', icon: 'featured_seasonal_and_gifts', badge: '1 Free' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 pb-safe bg-[#1c012d]/98 backdrop-blur-xl border-t border-[#ff6f00]/30 shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
      <div className="h-16 px-1.5 sm:px-3 max-w-[440px] mx-auto flex items-center justify-between gap-0.5">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => {
                playSound('click', soundEnabled);
                onNavigate(item.screen);
              }}
              className={`flex-1 flex flex-col items-center justify-center min-w-0 py-1 h-[52px] transition-all cursor-pointer relative active:scale-95 ${
                isActive ? 'text-[#ffdb3c] font-extrabold' : 'text-[#e1bfb0] hover:text-white'
              }`}
            >
              {/* Badge if any */}
              {item.badge && (
                <span className="absolute top-0.5 right-1 sm:right-2 bg-[#ff6689] text-white text-[8px] font-bold px-1 py-0.2 rounded-full shadow animate-pulse pointer-events-none whitespace-nowrap">
                  {item.badge}
                </span>
              )}

              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors ${
                  isActive ? 'bg-[#ffdb3c]/20 shadow-[0_0_10px_rgba(255,219,60,0.4)]' : ''
                }`}
              >
                <AppIcon
                  name={item.icon}
                  size={19}
                  className={isActive ? 'text-[#ffdb3c]' : 'text-[#e1bfb0]'}
                  fill={isActive ? '#ffdb3c' : 'none'}
                />
              </div>
              <span className="font-body text-[10px] sm:text-[11px] leading-none tracking-tight truncate max-w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
