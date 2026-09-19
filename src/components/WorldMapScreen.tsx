import React, { useState } from 'react';
import { LevelConfig, PlayerProfile } from '../types';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface WorldMapScreenProps {
  levels: LevelConfig[];
  activeLevelId: number;
  player: PlayerProfile;
  onSelectLevel: (levelId: number) => void;
  onStartBattle: (levelId: number) => void;
}

interface MapNodeDefinition {
  levelNumber: number;
  positionClass: string;
  name: string;
  isBoss?: boolean;
  isMiniBoss?: boolean;
  isTreasure?: boolean;
  bossTitle?: string;
  icon?: string;
}

const MAP_NODES: MapNodeDefinition[] = [
  {
    levelNumber: 10,
    positionClass: 'top-[80px] left-1/2 -translate-x-1/2',
    name: 'Sacred Gopuram Sanctum',
    isBoss: true,
    bossTitle: 'Maha Vighna Confrontation',
    icon: 'temple_hindu',
  },
  {
    levelNumber: 9,
    positionClass: 'top-[245px] left-[90px]',
    name: 'Bell Tower Stair',
    icon: 'notifications',
  },
  {
    levelNumber: 8,
    positionClass: 'top-[375px] right-[75px]',
    name: 'Bell Tower Guard',
    isMiniBoss: true,
    bossTitle: 'Move Limit Challenge',
    icon: 'crisis_alert',
  },
  {
    levelNumber: 7,
    positionClass: 'top-[505px] left-[80px]',
    name: 'Stage Courtyard',
    icon: 'stadium',
  },
  {
    levelNumber: 6,
    positionClass: 'top-[635px] right-[75px]',
    name: 'Lantern Row',
    icon: 'wb_incandescent',
  },
  {
    levelNumber: 5,
    positionClass: 'top-[765px] left-1/2 -translate-x-1/2',
    name: 'Community Pandal Haven',
    isTreasure: true,
    bossTitle: 'Lotus Blessing Milestone!',
    icon: 'card_giftcard',
  },
  {
    levelNumber: 4,
    positionClass: 'top-[925px] left-[85px]',
    name: 'Sweet Nectar Stalls',
    icon: 'local_cafe',
  },
  {
    levelNumber: 3,
    positionClass: 'top-[1035px] right-[60px]',
    name: 'Street Rangoli Bazaar',
    icon: 'auto_awesome',
  },
  {
    levelNumber: 2,
    positionClass: 'top-[1200px] left-[80px]',
    name: 'Modak Sweets Pandal',
    icon: 'bakery_dining',
  },
  {
    levelNumber: 1,
    positionClass: 'top-[1330px] left-1/2 -translate-x-1/2',
    name: 'Street Entrance',
    icon: 'door_front',
  },
];

export const WorldMapScreen: React.FC<WorldMapScreenProps> = ({
  levels,
  activeLevelId,
  player,
  onSelectLevel,
  onStartBattle,
}) => {
  const [selectedModalLevel, setSelectedModalLevel] = useState<LevelConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; icon: string } | null>(null);
  const [activeBoosters, setActiveBoosters] = useState<{ trident: boolean; lotus: boolean }>({
    trident: true,
    lotus: false,
  });

  const showToast = (text: string, icon: string = 'lock') => {
    playSound('defeat', player.soundEnabled);
    setToastMessage({ text, icon });
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleNodeClick = (level: LevelConfig) => {
    if (!level.isUnlocked) {
      if (level.id === 10) {
        showToast('Defeat levels 1-9 to face Maha Vighna at the Sacred Gopuram!', 'temple_hindu');
      } else if (level.id === 8) {
        showToast('Defeat Level 7 to challenge the Horned Vighna Mini-Boss!', 'warning');
      } else if (level.id === 5) {
        showToast('Reach Level 5 Pandal to claim Lotus Blessing Power!', 'card_giftcard');
      } else {
        showToast(`Level ${level.id} is LOCKED! Complete Level ${level.id - 1} to unlock.`, 'lock');
      }
      return;
    }

    onSelectLevel(level.id);
    setSelectedModalLevel(level);
    playSound('click', player.soundEnabled);
  };

  const currentActiveLevel =
    levels.find((l) => l.id === activeLevelId) ||
    levels.find((l) => l.isUnlocked && l.starsEarned === 0) ||
    levels[0];

  return (
    <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto pb-48 relative select-none overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1c012d]/95 border border-[#ffdb3c]/50 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <AppIcon name={toastMessage.icon} size={20} className="text-[#ffdb3c]" />
          <span className="font-body text-[12px] font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* TOP ZONE RIBBON BANNER */}
      <div className="sticky top-16 z-30 bg-gradient-to-r from-[#2b0e3b] via-[#4a2d5b] to-[#2b0e3b] border-b border-[#ff6f00]/30 px-3 py-1.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#ff6f00] flex items-center justify-center shadow">
            <AppIcon name="wb_twilight" size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-[12px] font-extrabold text-[#ffdb3c] uppercase leading-tight">
              World 1: Festival of Illuminations
            </span>
            <span className="font-body text-[10px] text-[#e1bfb0]">
              Street Bazaar → Maha Mandir Gopuram
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[#1c012d]/90 px-2.5 py-0.5 rounded-full border border-[#ffdb3c]/30">
          <span className="font-hud text-[11px] text-[#ffe16d] font-bold">
            Lvl {currentActiveLevel.id}/10
          </span>
        </div>
      </div>

      {/* FLOATING SIDE WIDGETS */}
      <div className="absolute top-12 left-2 z-30">
        <button
          onClick={() => showToast('Utsav Pass: Reach Level 5 to claim 150 Gems!', 'featured_seasonal_and_gifts')}
          className="bg-gradient-to-br from-[#ff6f00] via-[#ffdb3c] to-[#ff6f00] p-0.5 rounded-2xl shadow-[0_6px_16px_rgba(255,111,0,0.5)] active:scale-95 transition-transform flex flex-col items-center cursor-pointer"
        >
          <div className="bg-[#2b0e3b] px-2 py-1 rounded-[14px] flex flex-col items-center">
            <div className="relative">
              <AppIcon name="featured_seasonal_and_gifts" size={24} className="text-[#ffdb3c]" />
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-ping" />
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                1
              </span>
            </div>
            <span className="font-body text-[8px] text-[#ffe16d] font-bold mt-0.5">UTSAV PASS</span>
            <span className="text-[7px] text-[#ffb691] font-bold">Free Tier</span>
          </div>
        </button>
      </div>

      <div className="absolute top-12 right-2 z-30">
        <button
          onClick={() => showToast('Daily Aarti Spin ready to roll in Rewards tab!', 'celebration')}
          className="bg-gradient-to-br from-[#ff6689] via-[#ffb2be] to-[#ff6689] p-0.5 rounded-2xl shadow-[0_6px_16px_rgba(255,102,137,0.4)] active:scale-95 transition-transform flex flex-col items-center cursor-pointer"
        >
          <div className="bg-[#2b0e3b] px-2 py-1 rounded-[14px] flex flex-col items-center">
            <AppIcon name="celebration" size={24} className="text-[#ffb2be]" />
            <span className="font-body text-[8px] text-[#ffd9de] font-bold mt-0.5">SPIN DIYA</span>
            <span className="text-[7px] text-[#ffdb3c] font-bold">READY</span>
          </div>
        </button>
      </div>

      {/* MAP CANVAS CONTAINER */}
      <div className="relative w-full min-h-[1480px] overflow-hidden">
        {/* Atmosphere Vignette and Festive Garlands */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0326]/70 via-[#220532]/40 to-[#1a0326]/90 pointer-events-none" />

        {/* Golden Sparkles in Background */}
        <div className="absolute top-[180px] left-[60px] text-[#ffdb3c]/70 text-[18px] animate-pulse">✦</div>
        <div className="absolute top-[340px] right-[40px] text-[#ffb691]/70 text-[22px] animate-pulse">✧</div>
        <div className="absolute top-[520px] left-[100px] text-[#ffe16d]/80 text-[16px] animate-pulse">✦</div>
        <div className="absolute top-[780px] right-[80px] text-[#ffdb3c] text-[20px] animate-pulse">✧</div>
        <div className="absolute top-[1020px] left-[40px] text-[#ffb691] text-[24px] animate-pulse">✦</div>
        <div className="absolute top-[1250px] right-[120px] text-[#ffe16d] text-[18px] animate-pulse">✦</div>

        {/* CANDY CRUSH PROGRESSION PATH SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          preserveAspectRatio="none"
          viewBox="0 0 390 1480"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldMapRoad" x1="0%" x2="0%" y1="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb691" stopOpacity="1" />
              <stop offset="25%" stopColor="#ffdb3c" stopOpacity="1" />
              <stop offset="55%" stopColor="#ff6f00" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#ffd9de" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffe16d" stopOpacity="1" />
            </linearGradient>
            <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base trench */}
          <path
            d="M 195 1370 C 120 1320, 90 1280, 110 1240 C 140 1180, 290 1160, 275 1100 C 260 1030, 100 1020, 120 960 C 140 900, 190 860, 200 810 C 210 750, 300 730, 285 670 C 265 600, 95 600, 110 540 C 130 480, 290 470, 275 410 C 260 340, 110 340, 125 280 C 140 210, 195 180, 195 130"
            fill="none"
            stroke="#220532"
            strokeWidth="44"
            strokeLinecap="round"
          />
          {/* Marigold trim */}
          <path
            d="M 195 1370 C 120 1320, 90 1280, 110 1240 C 140 1180, 290 1160, 275 1100 C 260 1030, 100 1020, 120 960 C 140 900, 190 860, 200 810 C 210 750, 300 730, 285 670 C 265 600, 95 600, 110 540 C 130 480, 290 470, 275 410 C 260 340, 110 340, 125 280 C 140 210, 195 180, 195 130"
            fill="none"
            stroke="#592200"
            strokeWidth="32"
            strokeLinecap="round"
          />
          {/* Glowing road surface */}
          <path
            d="M 195 1370 C 120 1320, 90 1280, 110 1240 C 140 1180, 290 1160, 275 1100 C 260 1030, 100 1020, 120 960 C 140 900, 190 860, 200 810 C 210 750, 300 730, 285 670 C 265 600, 95 600, 110 540 C 130 480, 290 470, 275 410 C 260 340, 110 340, 125 280 C 140 210, 195 180, 195 130"
            fill="none"
            stroke="url(#goldMapRoad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Light stepping dots */}
          <path
            d="M 195 1370 C 120 1320, 90 1280, 110 1240 C 140 1180, 290 1160, 275 1100 C 260 1030, 100 1020, 120 960 C 140 900, 190 860, 200 810 C 210 750, 300 730, 285 670 C 265 600, 95 600, 110 540 C 130 480, 290 470, 275 410 C 260 340, 110 340, 125 280 C 140 210, 195 180, 195 130"
            fill="none"
            stroke="#fff9ef"
            strokeWidth="6"
            strokeDasharray="14 14"
            strokeLinecap="round"
            filter="url(#roadGlow)"
          />
        </svg>

        {/* NODES CONTAINER */}
        <div className="relative z-20 w-full h-[1480px]">
          {MAP_NODES.map((nodeMeta) => {
            const level = levels.find((l) => l.id === nodeMeta.levelNumber) || levels[nodeMeta.levelNumber - 1];
            if (!level) return null;

            const isCompleted = level.starsEarned > 0;
            const isCurrent = level.id === currentActiveLevel.id;
            const isUnlocked = level.isUnlocked;
            const isLocked = !level.isUnlocked;

            const statusText = isCurrent
              ? 'CURRENT'
              : isCompleted
              ? 'COMPLETED'
              : isUnlocked
              ? 'UNLOCKED'
              : 'LOCKED';

            return (
              <div
                key={level.id}
                className={`absolute ${nodeMeta.positionClass} flex flex-col items-center z-20`}
              >
                {/* Boss/Milestone Header Banner */}
                {nodeMeta.isBoss && (
                  <div className="mb-2 bg-gradient-to-r from-[#93000a] via-[#ff6689] to-[#93000a] text-white px-3 py-1 rounded-full shadow-lg border border-[#ffdb3c]/40 flex items-center gap-1.5">
                    <AppIcon name="local_fire_department" size={16} className="text-[#ffdb3c] animate-pulse" />
                    <span className="font-display text-[11px] uppercase tracking-wider font-extrabold text-[#ffe16d]">
                      {nodeMeta.bossTitle}
                    </span>
                  </div>
                )}

                {nodeMeta.isMiniBoss && (
                  <div className="mb-1.5 bg-[#93000a] text-white px-2.5 py-0.5 rounded-full border border-red-400/40 shadow flex items-center gap-1">
                    <AppIcon name="skull" size={12} />
                    <span className="font-body text-[9px] uppercase tracking-wider font-extrabold">
                      {nodeMeta.bossTitle || 'Mini-Boss'}
                    </span>
                  </div>
                )}

                {nodeMeta.isTreasure && (
                  <div className="mb-1.5 bg-gradient-to-r from-[#ff6689] via-[#ffdb3c] to-[#ff6689] text-[#400014] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-white/40">
                    <AppIcon name="filter_vintage" size={16} />
                    <span className="font-display text-[11px] font-extrabold uppercase tracking-wide">
                      {nodeMeta.bossTitle}
                    </span>
                  </div>
                )}

                {/* CURRENT ACTIVE BANNER (MUSHAK CHARACTER SPEECH) */}
                {isCurrent && (
                  <div className="candy-bounce-anim mb-1 flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-gradient-to-r from-[#ffdb3c] via-[#ff6f00] to-[#ffdb3c] text-[#341100] px-3 py-1 rounded-2xl shadow-[0_6px_18px_rgba(255,111,0,0.6)] border-2 border-white flex items-center gap-1.5">
                      <span className="text-[15px]">🐭</span>
                      <span className="font-display text-[10px] font-black tracking-wider uppercase">
                        {isCompleted ? 'MUSHAK SAYS: REPLAY!' : 'MUSHAK SAYS: PLAY HERE!'}
                      </span>
                      <span className="text-[13px]">🥟</span>
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#ffdb3c] -mt-0.5" />
                  </div>
                )}

                {/* INTERACTIVE NODE CIRCLE */}
                <div
                  className={`relative cursor-pointer group select-none transition-transform active:scale-95 ${
                    isLocked ? 'cursor-not-allowed' : ''
                  }`}
                  onClick={() => handleNodeClick(level)}
                >
                  {/* Glowing ambient ring for CURRENT */}
                  {isCurrent && (
                    <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#ffdb3c] via-[#ff6f00] to-[#ffdb3c] opacity-80 blur-xl animate-pulse" />
                  )}

                  {/* Node container sized by archetype */}
                  <div
                    className={`rounded-full flex items-center justify-center relative ${
                      nodeMeta.isBoss
                        ? 'w-24 h-24 p-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.9),0_0_24px_rgba(255,111,0,0.6)] ' +
                          (isLocked
                            ? 'bg-[#462856] border-2 border-stone-600'
                            : 'bg-gradient-to-b from-[#ffe16d] via-[#ff6f00] to-[#552000]')
                        : nodeMeta.isMiniBoss
                        ? 'w-[74px] h-[74px] p-1 shadow-[0_8px_20px_rgba(147,0,10,0.5)] ' +
                          (isLocked
                            ? 'bg-[#462856] border border-stone-600'
                            : 'bg-gradient-to-b from-red-600 to-[#552000]')
                        : nodeMeta.isTreasure
                        ? 'w-[84px] h-[84px] p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.8)] ' +
                          (isLocked
                            ? 'bg-[#462856]'
                            : 'bg-gradient-to-b from-[#ffd9de] via-[#ff6689] to-[#660025]')
                        : isCurrent
                        ? 'w-20 h-20 p-1.5 shadow-[0_12px_24px_rgba(255,111,0,0.7)] bg-gradient-to-b from-[#ffe16d] via-[#ff6f00] to-[#552000]'
                        : isCompleted
                        ? 'w-[72px] h-[72px] p-1 shadow-lg bg-gradient-to-b from-[#ffe16d] via-[#ffb691] to-[#a98a7c]'
                        : isUnlocked
                        ? 'w-16 h-16 p-1 shadow-lg bg-gradient-to-b from-[#ffdbcb] via-[#ffb691] to-[#594136]'
                        : 'w-16 h-16 p-1 shadow-lg bg-[#462856] border border-[#594136]/50 opacity-75'
                    }`}
                  >
                    {/* Inner core circle */}
                    <div
                      className={`w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden ${
                        isCurrent
                          ? 'bg-gradient-to-tr from-[#ff6f00] via-[#ffdb3c] to-[#fff9ef] border-2 border-white'
                          : isCompleted
                          ? 'bg-gradient-to-tr from-[#3a1d4a] to-[#220532] border-2 border-[#ffdb3c]/60'
                          : isUnlocked
                          ? 'bg-[#3a1d4a] border-2 border-[#ffb691]/40'
                          : 'bg-[#2b0e3b]'
                      }`}
                    >
                      {/* Icon for boss/milestone or standard number */}
                      {nodeMeta.isBoss ? (
                        <>
                          <AppIcon
                            name="temple_hindu"
                            size={30}
                            className={isLocked ? 'text-gray-500' : 'text-[#ffe16d]'}
                          />
                          <span className="font-hud text-[15px] font-black text-white leading-none drop-shadow">
                            10
                          </span>
                        </>
                      ) : nodeMeta.isMiniBoss ? (
                        <>
                          <AppIcon
                            name="crisis_alert"
                            size={22}
                            className={isLocked ? 'text-gray-500' : 'text-red-400'}
                          />
                          <span className="font-hud text-[16px] font-black text-white leading-none drop-shadow">
                            {level.id}
                          </span>
                        </>
                      ) : (
                        <span
                          className={`font-display leading-none drop-shadow ${
                            isCurrent
                              ? 'text-[32px] text-[#552000] font-black'
                              : isCompleted
                              ? 'text-[22px] text-[#ffe16d] font-black'
                              : isUnlocked
                              ? 'text-[20px] text-[#ffdbcb] font-black'
                              : 'text-[18px] text-[#a98a7c] font-bold'
                          }`}
                        >
                          {level.id}
                        </span>
                      )}

                      {/* Completed 3 Stars display inside node */}
                      {isCompleted && (
                        <div className="flex items-center gap-0.5 -mt-0.5">
                          <AppIcon
                            name="star"
                            size={11}
                            className={level.starsEarned >= 1 ? 'text-[#ffdb3c]' : 'text-gray-500'}
                            fill={level.starsEarned >= 1 ? '#ffdb3c' : 'none'}
                          />
                          <AppIcon
                            name="star"
                            size={11}
                            className={level.starsEarned >= 2 ? 'text-[#ffdb3c]' : 'text-gray-500'}
                            fill={level.starsEarned >= 2 ? '#ffdb3c' : 'none'}
                          />
                          <AppIcon
                            name="star"
                            size={11}
                            className={level.starsEarned >= 3 ? 'text-[#ffdb3c]' : 'text-gray-500'}
                            fill={level.starsEarned >= 3 ? '#ffdb3c' : 'none'}
                          />
                        </div>
                      )}

                      {/* Locked Padlock badge at bottom of inner circle */}
                      {isLocked && (
                        <div className="absolute -bottom-1 bg-[#1c012d] px-1.5 py-0.5 rounded-full border border-gray-600 shadow">
                          <AppIcon name="lock" size={11} className="text-[#a98a7c]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Corner Badge depending on state */}
                  {isCurrent ? (
                    <div className="absolute -right-2 -top-1 w-8 h-8 rounded-full bg-gradient-to-b from-[#ffdb3c] to-[#ff6f00] border-2 border-white flex items-center justify-center shadow-lg animate-bounce text-[#552000]">
                      <AppIcon name="play_arrow" size={18} fill="#552000" />
                    </div>
                  ) : isCompleted ? (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-b from-green-500 to-green-700 border-2 border-white flex items-center justify-center shadow text-white">
                      <AppIcon name="check" size={13} className="font-bold text-white" />
                    </div>
                  ) : isUnlocked ? (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#ffdb3c] border-2 border-[#552000] flex items-center justify-center shadow text-[#552000]">
                      <AppIcon name="lock_open" size={13} className="text-[#552000]" />
                    </div>
                  ) : null}
                </div>

                {/* Status Pill Badge: LOCKED | UNLOCKED | COMPLETED | CURRENT */}
                <div className="mt-1.5 flex flex-col items-center">
                  <span
                    className={`text-[9px] font-hud font-extrabold px-2 py-0.5 rounded-full shadow flex items-center gap-1 border ${
                      statusText === 'CURRENT'
                        ? 'bg-[#ff6f00] text-white border-[#ffdb3c]'
                        : statusText === 'COMPLETED'
                        ? 'bg-emerald-900/90 text-emerald-300 border-emerald-500/50'
                        : statusText === 'UNLOCKED'
                        ? 'bg-[#2b0e3b] text-[#ffe16d] border-[#ffdb3c]/40'
                        : 'bg-[#1c012d] text-gray-400 border-gray-700'
                    }`}
                  >
                    {statusText === 'CURRENT' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                    {statusText === 'LOCKED' && (
                      <AppIcon name="lock" size={10} />
                    )}
                    {statusText === 'COMPLETED' && (
                      <AppIcon name="check" size={10} />
                    )}
                    <span>{statusText}</span>
                  </span>

                  {/* Landmark name */}
                  <span className="font-display text-[11px] text-[#ffe16d] font-bold mt-0.5 drop-shadow text-center max-w-[130px] truncate">
                    {nodeMeta.name}
                  </span>

                  {/* Best score if completed */}
                  {level.highScore > 0 && (
                    <span className="font-body text-[9px] text-[#ffb691] font-bold">
                      Best: {level.highScore.toLocaleString()} pts
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DOCKED BOTTOM PLAY ACTION SHEET */}
      <aside className="fixed bottom-16 left-0 right-0 z-40 px-3 max-w-[440px] mx-auto pointer-events-none">
        <div className="pointer-events-auto bg-gradient-to-b from-[#3a1d4a]/95 via-[#2b0e3b]/98 to-[#1c012d]/98 border-2 border-[#ffdb3c]/40 backdrop-blur-xl rounded-3xl p-3 shadow-[0_-10px_35px_rgba(0,0,0,0.85)]">
          {/* Top card info */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6f00] to-[#ffdb3c] flex items-center justify-center text-white shadow-md">
                <span className="font-hud text-[18px] font-black">{currentActiveLevel.id}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-[14px] font-extrabold text-white leading-tight truncate max-w-[190px]">
                    {currentActiveLevel.title}
                  </h3>
                  <span
                    className={`text-[8px] font-hud font-bold px-1.5 py-0.2 rounded-full ${
                      currentActiveLevel.starsEarned > 0
                        ? 'bg-emerald-800 text-white'
                        : currentActiveLevel.isUnlocked
                        ? 'bg-[#ff6f00] text-white'
                        : 'bg-stone-800 text-gray-300'
                    }`}
                  >
                    {currentActiveLevel.starsEarned > 0
                      ? 'COMPLETED'
                      : currentActiveLevel.isUnlocked
                      ? 'UNLOCKED'
                      : 'LOCKED'}
                  </span>
                </div>
                <span className="font-body text-[11px] text-[#ffe16d]">
                  Target: {currentActiveLevel.targetScore.toLocaleString()} pts • {currentActiveLevel.moveLimit} Moves
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedModalLevel(currentActiveLevel)}
              className="text-[#e1bfb0] hover:text-white p-1 cursor-pointer"
              title="Level Details"
            >
              <AppIcon name="info" size={20} />
            </button>
          </div>

          {/* Booster Selection */}
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="font-body text-[10px] text-[#e1bfb0] uppercase tracking-wider font-bold">
              Boosters:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setActiveBoosters((prev) => ({ ...prev, trident: !prev.trident }))
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl shadow active:scale-95 transition cursor-pointer border ${
                  activeBoosters.trident
                    ? 'bg-[#594136] border-[#ffdb3c] text-[#ffdb3c]'
                    : 'bg-[#462856] border-[#ff6f00]/30 text-gray-300'
                }`}
              >
                <AppIcon name="flash_on" size={15} />
                <span className="font-body text-[11px] font-bold">Trident</span>
                <span className="w-4 h-4 rounded-full bg-[#ffdb3c] text-[#3a3000] text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                  1
                </span>
              </button>

              <button
                onClick={() =>
                  setActiveBoosters((prev) => ({ ...prev, lotus: !prev.lotus }))
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl shadow active:scale-95 transition cursor-pointer border ${
                  activeBoosters.lotus
                    ? 'bg-[#594136] border-[#ff6689] text-[#ffb2be]'
                    : 'bg-[#462856] border-[#ff6689]/30 text-gray-300'
                }`}
              >
                <AppIcon name="filter_vintage" size={15} />
                <span className="font-body text-[11px] font-bold">Lotus</span>
                <span className="w-4 h-4 rounded-full bg-[#ff6689] text-white text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                  2
                </span>
              </button>
            </div>
          </div>

          {/* PLAY / REPLAY BUTTON */}
          <button
            onClick={() => {
              if (!currentActiveLevel.isUnlocked) {
                showToast(`Level ${currentActiveLevel.id} is LOCKED! Complete Level ${currentActiveLevel.id - 1} first.`, 'lock');
                return;
              }
              onStartBattle(currentActiveLevel.id);
            }}
            disabled={!currentActiveLevel.isUnlocked}
            className={`w-full relative group overflow-hidden p-1 rounded-2xl shadow-lg active:translate-y-1 transition-all cursor-pointer border ${
              currentActiveLevel.isUnlocked
                ? 'bg-gradient-to-b from-[#ffe16d] via-[#ff9800] to-[#ff6f00] border-white/60 shadow-[0_8px_25px_rgba(255,111,0,0.65)]'
                : 'bg-[#2b0e3b] border-gray-700 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="py-2.5 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#552000] flex items-center justify-center text-[#ffdb3c] shadow-inner">
                  <AppIcon
                    name={currentActiveLevel.isUnlocked ? 'play_arrow' : 'lock'}
                    size={22}
                    className="text-[#ffdb3c]"
                    fill={currentActiveLevel.isUnlocked ? '#ffdb3c' : 'none'}
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-display text-[15px] font-black text-[#341100] tracking-wide leading-none uppercase">
                    {currentActiveLevel.starsEarned > 0
                      ? `REPLAY LEVEL ${currentActiveLevel.id}`
                      : currentActiveLevel.isUnlocked
                      ? `PLAY LEVEL ${currentActiveLevel.id}`
                      : `LEVEL ${currentActiveLevel.id} LOCKED`}
                  </span>
                  <span className="font-body text-[10px] text-[#552000] font-bold mt-0.5">
                    {currentActiveLevel.highScore > 0
                      ? `Best: ${currentActiveLevel.highScore.toLocaleString()} pts • ${currentActiveLevel.moveLimit} Moves`
                      : `Defeat ${currentActiveLevel.obstaclesRequired || currentActiveLevel.vighnasToDefeat} Vighnas • ${currentActiveLevel.moveLimit} Moves`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#552000] px-2.5 py-1 rounded-xl border border-[#ffdb3c]/40 shadow-inner">
                <AppIcon name="favorite" size={16} className="text-[#ff6689]" fill="#ff6689" />
                <span className="font-hud text-[13px] text-white font-black">-1</span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* LEVEL DETAIL MODAL POPUP */}
      {selectedModalLevel && (
        <div className="fixed inset-0 z-50 bg-[#1c012d]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#3a1d4a] to-[#220532] border-2 border-[#ffdb3c]/50 w-full max-w-sm rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative flex flex-col items-center text-center">
            <button
              onClick={() => setSelectedModalLevel(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#2b0e3b] border border-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
            >
              <AppIcon name="close" size={20} />
            </button>

            <div className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-[#ff6f00] via-[#ffdb3c] to-[#ff6f00] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(255,111,0,0.6)] -mt-11 mb-2 border-2 border-white">
              <AppIcon
                name={
                  selectedModalLevel.isBossLevel
                    ? 'skull'
                    : selectedModalLevel.starsEarned === 3
                    ? 'military_tech'
                    : selectedModalLevel.isUnlocked
                    ? 'play_circle'
                    : 'lock'
                }
                size={36}
                className="text-[#552000]"
              />
            </div>

            {/* Status pill badge */}
            <div className="mb-1">
              <span
                className={`text-[10px] font-hud font-extrabold px-3 py-0.5 rounded-full border shadow ${
                  !selectedModalLevel.isUnlocked
                    ? 'bg-[#1c012d] text-gray-400 border-gray-600'
                    : selectedModalLevel.id === currentActiveLevel.id
                    ? 'bg-[#ff6f00] text-white border-[#ffdb3c]'
                    : selectedModalLevel.starsEarned > 0
                    ? 'bg-emerald-900 text-emerald-300 border-emerald-500'
                    : 'bg-[#2b0e3b] text-[#ffe16d] border-[#ffdb3c]/40'
                }`}
              >
                {!selectedModalLevel.isUnlocked
                  ? 'LOCKED'
                  : selectedModalLevel.id === currentActiveLevel.id
                  ? 'CURRENT'
                  : selectedModalLevel.starsEarned > 0
                  ? 'COMPLETED'
                  : 'UNLOCKED'}
              </span>
            </div>

            <span className="font-body text-[11px] text-[#ffe16d] uppercase tracking-widest font-extrabold">
              {selectedModalLevel.subtitle}
            </span>
            <h3 className="font-display text-[22px] text-white font-black mt-0.5 mb-1">
              {selectedModalLevel.title}
            </h3>
            <p className="font-body text-[12px] text-[#e1bfb0] mb-3 px-2">
              {selectedModalLevel.description}
            </p>

            {/* Earned Stars & High Score row */}
            <div className="flex items-center justify-between w-full bg-[#1c012d]/70 px-3 py-1.5 rounded-xl border border-white/10 mb-3 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-[#e1bfb0] font-body text-[10px]">Stars:</span>
                <div className="flex items-center gap-0.5">
                  <AppIcon
                    name="star"
                    size={16}
                    className={selectedModalLevel.starsEarned >= 1 ? 'text-[#ffdb3c]' : 'text-gray-600'}
                    fill={selectedModalLevel.starsEarned >= 1 ? '#ffdb3c' : 'none'}
                  />
                  <AppIcon
                    name="star"
                    size={16}
                    className={selectedModalLevel.starsEarned >= 2 ? 'text-[#ffdb3c]' : 'text-gray-600'}
                    fill={selectedModalLevel.starsEarned >= 2 ? '#ffdb3c' : 'none'}
                  />
                  <AppIcon
                    name="star"
                    size={16}
                    className={selectedModalLevel.starsEarned >= 3 ? 'text-[#ffdb3c]' : 'text-gray-600'}
                    fill={selectedModalLevel.starsEarned >= 3 ? '#ffdb3c' : 'none'}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#e1bfb0] font-body text-[10px]">Best:</span>
                <span className="font-hud font-bold text-[#ffe16d]">
                  {selectedModalLevel.highScore > 0 ? `${selectedModalLevel.highScore.toLocaleString()} pts` : 'None'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full mb-3">
              <div className="bg-[#1c012d]/80 border border-[#ffdb3c]/20 p-2.5 rounded-2xl flex flex-col items-center">
                <AppIcon name="swap_calls" size={20} className="text-[#ffdb3c] mb-0.5" />
                <span className="font-hud text-[16px] text-white font-bold">{selectedModalLevel.moveLimit} Moves</span>
                <span className="font-body text-[10px] text-gray-400">Move Limit</span>
              </div>
              <div className="bg-[#1c012d]/80 border border-[#ff6689]/20 p-2.5 rounded-2xl flex flex-col items-center">
                <AppIcon name="crisis_alert" size={20} className="text-[#ff6689] mb-0.5" />
                <span className="font-hud text-[15px] text-white font-bold leading-tight">
                  {selectedModalLevel.objectiveType === 'score'
                    ? `${selectedModalLevel.targetScore.toLocaleString()} PTS`
                    : selectedModalLevel.objectiveType === 'create_specials'
                    ? `${selectedModalLevel.specialsRequired || 5} SPECIALS`
                    : selectedModalLevel.objectiveType === 'boss'
                    ? 'DEFEAT BOSS'
                    : `${selectedModalLevel.obstaclesRequired || selectedModalLevel.vighnasToDefeat} VIGHNAS`}
                </span>
                <span className="font-body text-[10px] text-gray-400">Objective</span>
              </div>
            </div>

            {/* Available Powers info */}
            {selectedModalLevel.availablePowers && (
              <div className="flex items-center justify-between w-full bg-[#1c012d]/60 px-3 py-1.5 rounded-xl border border-white/10 mb-4">
                <span className="text-[10px] font-body text-[#e1bfb0] font-bold">Powers:</span>
                <div className="flex items-center gap-2">
                  {selectedModalLevel.availablePowers.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] font-hud font-bold px-2 py-0.5 rounded-md bg-[#2b0e3b] text-[#ffe16d] border border-[#ffdb3c]/30 uppercase"
                    >
                      {p === 'trident' ? '🔱 Trident' : p === 'divine_blast' ? '💥 Blast' : '✨ Light'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            {selectedModalLevel.isUnlocked ? (
              <button
                onClick={() => {
                  const targetId = selectedModalLevel.id;
                  setSelectedModalLevel(null);
                  onStartBattle(targetId);
                }}
                className="w-full bg-gradient-to-b from-[#ffe16d] via-[#ff9800] to-[#ff6f00] py-3 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 text-[#341100] font-display text-[15px] font-black border border-white/60 cursor-pointer"
              >
                <AppIcon name="flash_on" size={22} className="text-[#341100]" />
                <span>
                  {selectedModalLevel.starsEarned > 0
                    ? 'REPLAY BATTLE (❤️ -1)'
                    : 'START BATTLE (❤️ -1)'}
                </span>
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-stone-800 text-gray-400 py-3 rounded-2xl border border-gray-700 font-display text-[13px] font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <AppIcon name="lock" size={18} />
                <span>LOCKED • CLEAR LEVEL {selectedModalLevel.id - 1} FIRST</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
