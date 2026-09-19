import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerProfile } from '../types';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface RewardsScreenProps {
  player: PlayerProfile;
  onAddCoins: (amount: number) => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ player, onAddCoins }) => {
  const [spinning, setSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);

  const wheelSegments = [
    { label: '+100 Coins', value: 100, color: '#ff9800' },
    { label: 'Trident Booster', value: 50, color: '#ff6f00' },
    { label: '+250 Coins', value: 250, color: '#ffe16d' },
    { label: '+1 Heart', value: 10, color: '#ff6689' },
    { label: '+500 Coins', value: 500, color: '#ffdb3c' },
    { label: 'Lotus Core', value: 100, color: '#f472b6' },
    { label: '+50 Coins', value: 50, color: '#ffb691' },
    { label: 'Surya Modak', value: 75, color: '#facc15' },
  ];

  const handleSpin = () => {
    if (spinning || hasSpunToday) return;
    setSpinning(true);
    playSound('power', player.soundEnabled);

    // Pick random segment (e.g. index 2: +250 Coins)
    const winningIndex = Math.floor(Math.random() * wheelSegments.length);
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const degrees = extraRounds * 360 + (winningIndex * (360 / wheelSegments.length));
    setSpinDeg(degrees);

    setTimeout(() => {
      setSpinning(false);
      setHasSpunToday(true);
      const prize = wheelSegments[winningIndex];
      setWonPrize(prize.label);
      onAddCoins(prize.value);
      playSound('victory', player.soundEnabled);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
        });
      } catch {
        // Safe confetti fallback
      }
    }, 3200);
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto pb-24 px-3.5 pt-3 select-none">
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="font-body text-[11px] text-[#ffb691] uppercase tracking-wider font-extrabold">
            Daily Aarti & Prasadam
          </span>
          <h2 className="font-display text-[22px] font-black text-[#ffdb3c]">
            Festival Rewards
          </h2>
        </div>
        <div className="flex items-center gap-1.5 bg-[#2b0e3b] px-3 py-1.5 rounded-full border border-[#ffe16d]/30 shadow">
          <AppIcon name="monetization_on" size={18} className="text-[#ffe16d]" />
          <span className="font-hud text-[14px] text-white font-bold">
            {player.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* AARTI SPIN DIYA WHEEL CARD */}
      <div className="bg-[#2b0e3b] rounded-2xl p-4 border border-[#ff6f00]/30 shadow-lg flex flex-col items-center text-center mb-4 relative overflow-hidden">
        <div className="flex items-center gap-1.5 mb-1 text-[#ffdb3c]">
          <AppIcon name="celebration" size={20} />
          <h3 className="font-display text-[16px] font-extrabold">Daily Aarti Wheel of Kripa</h3>
        </div>
        <p className="font-body text-[11px] text-[#e1bfb0] mb-3">
          Spin the consecrated diya once a day for free boosters and golden modak coins!
        </p>

        {/* Wheel Container */}
        <div className="relative w-52 h-52 flex items-center justify-center my-2">
          {/* Wheel Pointer */}
          <div className="absolute -top-3 z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-red-600 shadow-lg" />
          </div>

          {/* Rotating Wheel Plate */}
          <div
            className="w-full h-full rounded-full border-4 border-[#ffdb3c] shadow-[0_0_20px_rgba(255,219,60,0.5)] relative overflow-hidden transition-transform duration-[3200ms] ease-out"
            style={{ transform: `rotate(${spinDeg}deg)` }}
          >
            {wheelSegments.map((seg, idx) => {
              const rotateAngle = (360 / wheelSegments.length) * idx;
              return (
                <div
                  key={idx}
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-display font-extrabold text-[#341100]"
                  style={{
                    transform: `rotate(${rotateAngle}deg)`,
                    backgroundColor: seg.color,
                    clipPath: 'polygon(50% 50%, 0 0, 100% 0)',
                  }}
                >
                  <span className="relative -top-14 font-black truncate max-w-[80px]">
                    {seg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Central Golden Diya Center Hub */}
          <div className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-[#ffe16d] to-[#ff6f00] border-2 border-white shadow-lg flex items-center justify-center text-white z-20">
            <AppIcon name="local_fire_department" size={24} />
          </div>
        </div>

        {/* Spin Result or CTA Button */}
        {wonPrize ? (
          <div className="mt-2 bg-[#ffdb3c] text-[#341100] px-4 py-2 rounded-full font-display font-black text-[13px] animate-bounce shadow">
            🎉 BLESSED WITH: {wonPrize}!
          </div>
        ) : (
          <button
            onClick={handleSpin}
            disabled={spinning || hasSpunToday}
            className={`mt-2 w-full max-w-[220px] py-3 rounded-full font-display text-[14px] font-black shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
              hasSpunToday
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#ffe16d] via-[#ff9800] to-[#ff6f00] text-[#341100] hover:brightness-110'
            }`}
          >
            <AppIcon name="sync" size={20} />
            <span>{spinning ? 'SPINNING...' : hasSpunToday ? 'SPUN FOR TODAY' : 'FREE SPIN!'}</span>
          </button>
        )}
      </div>

      {/* UTSAV PASS REWARD TRACK */}
      <div className="bg-[#2b0e3b] rounded-2xl p-3.5 border border-[#ffdb3c]/30 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppIcon name="featured_seasonal_and_gifts" size={20} className="text-[#ffdb3c]" />
            <h3 className="font-display text-[15px] font-extrabold text-white">Chaturthi Utsav Pass</h3>
          </div>
          <span className="font-hud text-[11px] text-[#ffe16d] bg-[#3a1d4a] px-2 py-0.5 rounded-full border border-[#ffe16d]/30">
            Tier 3 / 10
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {/* Milestone 1 */}
          <div className="bg-[#1c012d] p-2.5 rounded-xl flex items-center justify-between border border-emerald-500/30">
            <div className="flex items-center gap-2.5">
              <AppIcon name="check_circle" size={22} className="text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-display text-[12px] text-white font-bold">Tier 1: Starter Prasadam</span>
                <span className="font-body text-[10px] text-gray-400">+100 Coins & +1 Heart</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Claimed</span>
          </div>

          {/* Milestone 2 */}
          <div className="bg-[#3a1d4a] p-2.5 rounded-xl flex items-center justify-between border border-[#ffdb3c]">
            <div className="flex items-center gap-2.5">
              <AppIcon name="card_giftcard" size={22} className="text-[#ffdb3c]" />
              <div className="flex flex-col">
                <span className="font-display text-[12px] text-white font-bold">Tier 3: Trishul Charge</span>
                <span className="font-body text-[10px] text-[#ffe16d]">+250 Coins & Trident Booster</span>
              </div>
            </div>
            <button
              onClick={() => {
                playSound('victory', player.soundEnabled);
                onAddCoins(250);
              }}
              className="bg-[#ffdb3c] text-[#341100] px-3 py-1 rounded-full font-display text-[11px] font-extrabold shadow active:scale-95 cursor-pointer"
            >
              CLAIM
            </button>
          </div>

          {/* Milestone 3 */}
          <div className="bg-[#1c012d] p-2.5 rounded-xl flex items-center justify-between border border-white/10 opacity-70">
            <div className="flex items-center gap-2.5">
              <AppIcon name="lock" size={22} className="text-gray-400" />
              <div className="flex flex-col">
                <span className="font-display text-[12px] text-gray-300 font-bold">Tier 5: Lotus Core Chest</span>
                <span className="font-body text-[10px] text-gray-400">Unlock at Level 5</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 font-bold">LOCKED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
