import React, { useState } from 'react';
import { Screen, PlayerProfile } from '../types';
import { ASSETS } from '../data/gameData';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  player: PlayerProfile;
  onToggleSound: () => void;
  onToggleMotion: () => void;
  onOpenProfile: () => void;
  onOpenSocial: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  isOnline?: boolean;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  player,
  onToggleSound,
  onToggleMotion,
  onOpenProfile,
  onOpenSocial,
  onOpenNotifications,
  unreadCount = 0,
  isOnline = true,
  title,
  subtitle,
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 pt-safe bg-[#1c012d]/98 backdrop-blur-xl border-b border-[#ff6f00]/25 shadow-[0_6px_25px_rgba(0,0,0,0.8)]">
      {/* Offline sync banner if disconnected */}
      {!isOnline && (
        <div className="bg-[#521327] border-b border-[#ff6689]/40 text-[#ffd9de] py-1 px-3 text-center text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1.5 animate-pulse">
          <AppIcon name="cloud_off" size={13} className="text-[#ff6689]" />
          <span>Connection lost. Your progress will sync when you&apos;re back online.</span>
        </div>
      )}

      <div className="h-14 sm:h-16 px-2 sm:px-3 flex items-center justify-between gap-1 sm:gap-2 max-w-[440px] mx-auto w-full">
        {/* Left: Back button (if not home) + Logo/Title */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
          {currentScreen !== 'home' && (
            <button
              onClick={() => {
                playSound('click', player.soundEnabled);
                onNavigate('home');
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-[#3a1d4a] hover:bg-[#462856] text-[#fff9ef] transition-transform active:scale-90 shadow-md shrink-0 cursor-pointer"
              title="Return to Home"
            >
              <AppIcon name="arrow_back" size={15} />
            </button>
          )}

          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 cursor-pointer select-none min-w-0"
          >
            <img
              src={ASSETS.logo}
              alt="Modak Mahayudh"
              className="h-6 sm:h-7 w-auto object-contain drop-shadow-[0_2px_6px_rgba(255,219,60,0.5)] shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <h1 className="font-display text-[11px] sm:text-[13px] font-extrabold text-[#ffdb3c] leading-tight truncate drop-shadow">
                {title || 'Modak Mahayudh'}
              </h1>
              <span className="font-body text-[8px] sm:text-[9px] text-[#ffb691] font-semibold uppercase tracking-wider truncate">
                {subtitle || (currentScreen === 'home' ? 'Festival Defense' : currentScreen.toUpperCase())}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Currency, Social, Notification, Profile Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Hearts / Lives */}
          <div className="flex items-center gap-1 bg-[#2b0e3b] border border-[#ff6689]/40 px-1.5 sm:px-2 py-0.5 rounded-full shadow-inner">
            <AppIcon name="favorite" size={12} className="text-[#ff6689]" fill="#ff6689" />
            <span className="font-hud text-[11px] text-white font-bold">{player.lives}</span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1 bg-[#2b0e3b] border border-[#ffdb3c]/40 px-1.5 sm:px-2 py-0.5 rounded-full shadow-inner">
            <AppIcon name="monetization_on" size={12} className="text-[#ffe16d]" fill="#ffe16d" />
            <span className="font-hud text-[11px] text-[#ffe16d] font-bold">
              {player.coins >= 10000 ? `${Math.round(player.coins / 1000)}k` : player.coins.toLocaleString()}
            </span>
          </div>

          {/* Friends Icon */}
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onOpenSocial();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3a1d4a] hover:bg-[#462856] text-[#ffb691] hover:text-white flex items-center justify-center transition-transform active:scale-90 shadow cursor-pointer"
            title="Friends & Life Requests"
          >
            <AppIcon name="group" size={15} />
          </button>

          {/* Notifications Icon with Badge */}
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onOpenNotifications();
            }}
            className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3a1d4a] hover:bg-[#462856] text-[#ffdb3c] flex items-center justify-center transition-transform active:scale-90 shadow cursor-pointer"
            title="Temple Notifications"
          >
            <AppIcon name="notifications" size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#ff6689] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Player Profile Avatar Button */}
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onOpenProfile();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#ff6f00] to-[#ffdb3c] p-0.5 flex items-center justify-center transition-transform active:scale-90 shadow-md cursor-pointer"
            title="View Player Profile"
          >
            <div className="w-full h-full bg-[#1c012d] rounded-full flex items-center justify-center text-[#ffdb3c]">
              <AppIcon name="person" size={15} />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
