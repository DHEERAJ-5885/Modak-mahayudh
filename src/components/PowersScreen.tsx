import React from 'react';
import { PlayerProfile } from '../types';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface PowersScreenProps {
  player: PlayerProfile;
  onUpgradePower: (powerKey: string, cost: number) => void;
}

export const PowersScreen: React.FC<PowersScreenProps> = ({ player, onUpgradePower }) => {
  const powers = [
    {
      key: 'trident',
      name: 'Trident Strike',
      icon: 'stat_3',
      unlockLevel: 1,
      level: player.tridentLevel || 1,
      desc: 'Single-target divine spear piercing the foremost approaching Vighna with immense sacred power.',
      cost: 450,
      gradient: 'from-[#ffe16d] to-[#ff6f00]',
    },
    {
      key: 'divine_blast',
      name: 'Divine Blast',
      icon: 'auto_awesome',
      unlockLevel: 2,
      level: player.lotusLevel || 1,
      desc: 'Radiates a high-potency shockwave dealing direct damage to all incoming obstacles simultaneously.',
      cost: 550,
      gradient: 'from-[#ffb2be] to-[#db2777]',
    },
    {
      key: 'festival_light',
      name: 'Festival Light',
      icon: 'wb_sunny',
      unlockLevel: 3,
      level: player.mushakLevel || 1,
      desc: 'Clears the sacred central 3×3 modak zone on the board and smites all active obstacles with holy light.',
      cost: 650,
      gradient: 'from-[#fef08a] to-[#ca8a04]',
    },
    {
      key: 'chant',
      name: 'Om Gam Cosmic Chant',
      icon: 'temple_hindu',
      unlockLevel: 10,
      level: 1,
      desc: 'Channel the supreme cosmic mantra to shatter shields of Asura lords and purge calamity.',
      cost: 1000,
      gradient: 'from-[#a855f7] to-[#6366f1]',
    },
  ];

  return (
    <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto pb-24 px-3.5 pt-3 select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="font-body text-[11px] text-[#ffb691] uppercase tracking-wider font-extrabold">
            Sacred Arsenal
          </span>
          <h2 className="font-display text-[22px] font-black text-[#ffdb3c]">
            Divine Powers
          </h2>
        </div>
        <div className="flex items-center gap-1.5 bg-[#2b0e3b] px-3 py-1.5 rounded-full border border-[#ffe16d]/30 shadow">
          <AppIcon name="monetization_on" size={18} className="text-[#ffe16d]" />
          <span className="font-hud text-[14px] text-white font-bold">
            {player.coins.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {powers.map((p) => {
          const isUnlocked =
            player.currentLevel >= p.unlockLevel ||
            (player.unlockedPowers && player.unlockedPowers.includes(p.key));
          const canAfford = player.coins >= p.cost;

          return (
            <div
              key={p.key}
              className={`bg-[#2b0e3b] rounded-2xl p-3.5 border shadow-lg flex flex-col gap-2 relative overflow-hidden transition-all ${
                isUnlocked ? 'border-[#ff6f00]/30' : 'border-stone-700/60 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      isUnlocked ? p.gradient : 'from-stone-700 to-stone-900'
                    } flex items-center justify-center text-[#3a1d4a] shadow-md relative`}
                  >
                    <AppIcon
                      name={isUnlocked ? p.icon : 'lock'}
                      size={28}
                      className="text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-[16px] font-extrabold text-white">{p.name}</h3>
                      {isUnlocked ? (
                        <span className="font-hud text-[11px] bg-[#3a1d4a] px-2 py-0.5 rounded-md text-[#ffe16d] font-bold border border-[#ffe16d]/30">
                          LVL {p.level}
                        </span>
                      ) : (
                        <span className="font-hud text-[10px] bg-stone-800 px-2 py-0.5 rounded-md text-stone-300 font-bold border border-stone-600">
                          LVL {p.unlockLevel} UNLOCK
                        </span>
                      )}
                    </div>
                    <p className="font-body text-[11px] text-[#e1bfb0] line-clamp-2 mt-0.5">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10 mt-1">
                <span className="font-body text-[11px] text-[#ffb691]">
                  {isUnlocked ? 'Next: +25% Surge Power' : `Available upon clearing Level ${p.unlockLevel - 1}`}
                </span>

                {isUnlocked ? (
                  <button
                    onClick={() => {
                      if (canAfford) {
                        playSound('power', player.soundEnabled);
                        onUpgradePower(p.key, p.cost);
                      }
                    }}
                    disabled={!canAfford}
                    className={`px-4 py-1.5 rounded-full font-display text-[12px] font-extrabold flex items-center gap-1.5 shadow transition-all active:scale-95 ${
                      canAfford
                        ? 'bg-gradient-to-r from-[#ffe16d] to-[#ff9800] text-[#341100] cursor-pointer hover:brightness-110'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>UPGRADE</span>
                    <span className="font-hud">{p.cost} 🪙</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-stone-400 text-[11px] font-body">
                    <AppIcon name="lock" size={14} />
                    <span>Locked</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
