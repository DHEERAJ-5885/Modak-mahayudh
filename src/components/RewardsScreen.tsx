import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerProfile } from '../types';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface RewardsScreenProps {
  player: PlayerProfile;
  onAddCoins: (amount: number) => void;
  onClaimReward?: (tierId: string, coins: number, hearts?: number) => void;
  onSpinComplete?: (prizeValue: number, spinTimestamp: number) => void;
}

interface RewardTier {
  id: string;
  name: string;
  desc: string;
  requiredLevel: number;
  coins: number;
  hearts?: number;
  icon: string;
}

const REWARD_TIERS: RewardTier[] = [
  {
    id: 'tier_1',
    name: 'Tier 1: Starter Prasadam',
    desc: '+100 Coins & +1 Heart',
    requiredLevel: 1,
    coins: 100,
    hearts: 1,
    icon: 'card_giftcard',
  },
  {
    id: 'tier_3',
    name: 'Tier 3: Trishul Charge',
    desc: '+250 Coins & Trident Booster',
    requiredLevel: 3,
    coins: 250,
    hearts: 0,
    icon: 'stat_3',
  },
  {
    id: 'tier_5',
    name: 'Tier 5: Lotus Core Chest',
    desc: '+500 Coins & Lotus Blessing',
    requiredLevel: 5,
    coins: 500,
    hearts: 1,
    icon: 'spa',
  },
  {
    id: 'tier_7',
    name: 'Tier 7: Diya Radiance',
    desc: '+750 Coins & Aura Shield',
    requiredLevel: 7,
    coins: 750,
    hearts: 1,
    icon: 'wb_sunny',
  },
  {
    id: 'tier_10',
    name: 'Tier 10: Maha Gopuram Crown',
    desc: '+1500 Coins & +3 Sacred Hearts',
    requiredLevel: 10,
    coins: 1500,
    hearts: 3,
    icon: 'temple_hindu',
  },
];

const COOLDOWN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  player,
  onAddCoins,
  onClaimReward,
  onSpinComplete,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // 1-second live countdown timer for 24-hour spin cooldown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const lastSpin = player.lastSpinTime || 0;
  const timeElapsed = currentTime - lastSpin;
  const isCooldownActive = lastSpin > 0 && timeElapsed < COOLDOWN_DURATION_MS;
  const msRemaining = Math.max(0, COOLDOWN_DURATION_MS - timeElapsed);

  const formatCooldown = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

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
    if (spinning || isCooldownActive) return;
    setSpinning(true);
    setWonPrize(null);
    playSound('power', player.soundEnabled);

    const winningIndex = Math.floor(Math.random() * wheelSegments.length);
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const degrees = extraRounds * 360 + (winningIndex * (360 / wheelSegments.length));
    setSpinDeg(degrees);

    const spinTimestamp = Date.now();

    setTimeout(() => {
      setSpinning(false);
      const prize = wheelSegments[winningIndex];
      setWonPrize(prize.label);

      // Persist the 24-hour cooldown timestamp and add prize
      if (onSpinComplete) {
        onSpinComplete(prize.value, spinTimestamp);
      } else {
        onAddCoins(prize.value);
      }

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

  const handleClaimTier = (tier: RewardTier) => {
    const claimedList = player.claimedRewards || [];
    // Strict duplicate check
    if (claimedList.includes(tier.id)) {
      return;
    }

    // Verify qualification
    const playerLevel = player.highestLevel || 1;
    if (playerLevel < tier.requiredLevel) {
      return;
    }

    playSound('victory', player.soundEnabled);

    if (onClaimReward) {
      onClaimReward(tier.id, tier.coins, tier.hearts || 0);
    } else {
      onAddCoins(tier.coins);
    }

    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch {
      // Safe fallback
    }
  };

  const claimedList = player.claimedRewards || [];
  const playerHighestLevel = player.highestLevel || 1;

  return (
    <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pb-[calc(6rem+max(env(safe-area-inset-bottom,0px),12px))] px-3.5 pt-3 touch-pan-y">
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

        {/* Spin Result Feedback */}
        {wonPrize && (
          <div className="my-2 bg-[#ffdb3c] text-[#341100] px-4 py-1.5 rounded-full font-display font-black text-[13px] animate-bounce shadow">
            🎉 BLESSED WITH: {wonPrize}!
          </div>
        )}

        {/* Free Spin CTA / Cooldown Indicator */}
        {isCooldownActive ? (
          <div className="flex flex-col items-center gap-1 mt-2 w-full max-w-[260px]">
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-full font-display text-[13px] font-extrabold shadow bg-stone-900/90 border border-[#ffe16d]/30 text-stone-300 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AppIcon name="schedule" size={18} className="text-[#ffe16d] animate-spin" />
              <span>COOLDOWN: {formatCooldown(msRemaining)}</span>
            </button>
            <span className="text-[10px] text-[#ffb691] font-hud font-bold tracking-wider">
              24-Hour Aarti Cooldown Active
            </span>
          </div>
        ) : (
          <button
            onClick={handleSpin}
            disabled={spinning}
            className={`mt-2 w-full max-w-[240px] py-3 rounded-full font-display text-[14px] font-black shadow-[0_4px_20px_rgba(255,219,60,0.4)] transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
              spinning
                ? 'bg-amber-600 text-stone-900 cursor-wait'
                : 'bg-gradient-to-r from-[#ffe16d] via-[#ff9800] to-[#ff6f00] text-[#341100] hover:brightness-110 animate-pulse'
            }`}
          >
            <AppIcon name="celebration" size={20} />
            <span>{spinning ? 'SPINNING DIYA...' : 'FREE SPIN AVAILABLE!'}</span>
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
          <span className="font-hud text-[11px] text-[#ffe16d] bg-[#3a1d4a] px-2.5 py-0.5 rounded-full border border-[#ffe16d]/30 font-bold">
            Level {playerHighestLevel} / 10
          </span>
        </div>

        <p className="font-body text-[11px] text-[#e1bfb0]">
          Advance through sacred festival levels to claim one-time consecrated milestones.
        </p>

        <div className="flex flex-col gap-2.5 mt-1">
          {REWARD_TIERS.map((tier) => {
            const isClaimed = claimedList.includes(tier.id);
            const isUnlocked = playerHighestLevel >= tier.requiredLevel;

            return (
              <div
                key={tier.id}
                className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
                  isClaimed
                    ? 'bg-[#1c012d]/80 border-emerald-500/30'
                    : isUnlocked
                    ? 'bg-gradient-to-r from-[#3a1d4a] to-[#46235b] border-[#ffdb3c] shadow-md'
                    : 'bg-[#1c012d]/50 border-white/10 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${
                      isClaimed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : isUnlocked
                        ? 'bg-gradient-to-br from-[#ff6f00] to-[#ffdb3c] text-white'
                        : 'bg-stone-800 text-stone-500 border border-white/5'
                    }`}
                  >
                    <AppIcon name={isClaimed ? 'check_circle' : tier.icon} size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`font-display text-[12px] font-bold ${
                        isClaimed ? 'text-gray-300' : isUnlocked ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {tier.name}
                    </span>
                    <span
                      className={`font-body text-[10px] ${
                        isClaimed ? 'text-gray-500' : isUnlocked ? 'text-[#ffe16d]' : 'text-gray-500'
                      }`}
                    >
                      {tier.desc}
                    </span>
                  </div>
                </div>

                {isClaimed ? (
                  <div className="flex items-center gap-1 text-emerald-400 font-hud text-[11px] font-extrabold uppercase px-2.5 py-1 bg-emerald-950/60 rounded-full border border-emerald-500/30">
                    <AppIcon name="check_circle" size={14} className="text-emerald-400" />
                    <span>CLAIMED</span>
                  </div>
                ) : isUnlocked ? (
                  <button
                    onClick={() => handleClaimTier(tier)}
                    className="bg-gradient-to-r from-[#ffe16d] via-[#ffdb3c] to-[#ff9800] text-[#341100] px-3.5 py-1.5 rounded-full font-display text-[11px] font-black shadow-lg hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <AppIcon name="card_giftcard" size={14} />
                    <span>CLAIM</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-400 font-hud font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                    LVL {tier.requiredLevel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
