import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { playerService } from '../services/playerService';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';
import { ASSETS } from '../data/gameData';

interface ProfileModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlayer: (updated: PlayerProfile) => void;
  onLogout: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'ganesha', label: 'Lord Ganesha', icon: 'temple_hindu', color: 'from-amber-500 to-red-600' },
  { id: 'mushak', label: 'Loyal Mushak', icon: 'pest_control', color: 'from-purple-500 to-indigo-600' },
  { id: 'trishul', label: 'Divya Trishul', icon: 'flash_on', color: 'from-yellow-400 to-orange-500' },
  { id: 'lotus', label: 'Sacred Lotus', icon: 'local_florist', color: 'from-pink-400 to-rose-600' },
  { id: 'diya', label: 'Utsav Diya', icon: 'wb_incandescent', color: 'from-amber-400 to-yellow-600' },
  { id: 'modak', label: 'Golden Modak', icon: 'stars', color: 'from-yellow-300 to-amber-500' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  player,
  isOpen,
  onClose,
  onUpdatePlayer,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.displayName || player.name);
  const [selectedAvatar, setSelectedAvatar] = useState(player.avatar || 'ganesha');
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      playSound('click', player.soundEnabled);
      if (player.id) {
        await playerService.savePlayerProfile(player.id, {
          name: editName.trim(),
          displayName: editName.trim(),
          avatar: selectedAvatar,
        });
      }
      onUpdatePlayer({
        ...player,
        name: editName.trim(),
        displayName: editName.trim(),
        avatar: selectedAvatar,
      });
      setIsEditing(false);
      playSound('victory', player.soundEnabled);
    } catch (e) {
      console.error('Error updating profile:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyId = () => {
    if (player.id) {
      navigator.clipboard.writeText(player.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      playSound('click', player.soundEnabled);
    }
  };

  const currentAvatarMeta =
    AVATAR_OPTIONS.find((a) => a.id === (player.avatar || 'ganesha')) || AVATAR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-[400px] bg-[#1c012d] border border-[#ffdb3c]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#2b0e3b] via-[#3a1d4a] to-[#2b0e3b] p-4 flex items-center justify-between border-b border-[#ff6f00]/30">
          <div className="flex items-center gap-2">
            <AppIcon name="account_circle" size={20} className="text-[#ffdb3c]" />
            <h2 className="font-display text-[16px] font-black text-[#ffdb3c] tracking-tight">
              Player Profile
            </h2>
          </div>
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#1c012d] hover:bg-[#2b0e3b] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow"
          >
            <AppIcon name="close" size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Avatar & Display Name Section */}
          <div className="flex flex-col items-center text-center bg-[#250838] p-4 rounded-2xl border border-[#ff6f00]/20 relative shadow-inner">
            {/* Online Status Pill */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#140120] px-2 py-0.5 rounded-full border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                Cloud Synced
              </span>
            </div>

            {/* Avatar Circle */}
            <div className="relative mb-2">
              <div
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${currentAvatarMeta.color} p-1 shadow-[0_0_20px_rgba(255,219,60,0.3)] flex items-center justify-center`}
              >
                <div className="w-full h-full bg-[#1c012d] rounded-xl flex items-center justify-center text-[#ffdb3c]">
                  <AppIcon name={currentAvatarMeta.icon} size={32} />
                </div>
              </div>
            </div>

            {/* Player Identity */}
            {!isEditing ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-[17px] sm:text-[19px] font-extrabold text-white">
                    {player.displayName || player.name}
                  </h3>
                  <button
                    onClick={() => {
                      playSound('click', player.soundEnabled);
                      setIsEditing(true);
                    }}
                    className="p-1 text-[#ffb691] hover:text-[#ffdb3c] cursor-pointer"
                    title="Edit Name & Avatar"
                  >
                    <AppIcon name="edit" size={14} />
                  </button>
                </div>
                {player.email && (
                  <span className="text-[11px] text-[#e1bfb0] font-medium">{player.email}</span>
                )}
                {player.id && (
                  <button
                    onClick={handleCopyId}
                    className="mt-1 flex items-center gap-1 bg-[#1c012d] px-2 py-0.5 rounded-md text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    <span>ID: {player.id.substring(0, 10)}...</span>
                    <AppIcon name={copiedId ? 'check' : 'content_copy'} size={11} className={copiedId ? 'text-emerald-400' : ''} />
                    {copiedId && <span className="text-emerald-400 font-bold">Copied!</span>}
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2 mt-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={25}
                  className="bg-[#1c012d] border border-[#ffdb3c] rounded-xl px-3 py-1.5 text-center text-[14px] text-white font-bold outline-none shadow-inner"
                  placeholder="Player Name"
                />

                {/* Avatar Selection Grid */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {AVATAR_OPTIONS.map((opt) => {
                    const isSel = selectedAvatar === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedAvatar(opt.id)}
                        className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          isSel
                            ? 'bg-[#3a1d4a] border-[#ffdb3c] shadow'
                            : 'bg-[#1c012d] border-[#3a1d4a] text-gray-400'
                        }`}
                      >
                        <AppIcon name={opt.icon} size={16} className={isSel ? 'text-[#ffdb3c]' : ''} />
                        <span className="text-[9px] truncate max-w-full">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-1.5 rounded-lg bg-[#3a1d4a] text-gray-300 text-[11px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 py-1.5 rounded-lg bg-[#ff6f00] hover:bg-[#ff8017] text-white text-[11px] font-extrabold cursor-pointer shadow"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Player Progression Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#2b0e3b] p-2.5 rounded-xl border border-[#ff6f00]/20 flex items-center gap-2.5 shadow">
              <div className="w-8 h-8 rounded-lg bg-[#3a1d4a] flex items-center justify-center text-[#ffdb3c] shrink-0">
                <AppIcon name="military_tech" size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#ffb691] uppercase font-bold">Current Level</span>
                <span className="text-[14px] font-black text-white font-hud">
                  Level {player.currentLevel}
                </span>
              </div>
            </div>

            <div className="bg-[#2b0e3b] p-2.5 rounded-xl border border-[#ff6f00]/20 flex items-center gap-2.5 shadow">
              <div className="w-8 h-8 rounded-lg bg-[#3a1d4a] flex items-center justify-center text-[#ffdb3c] shrink-0">
                <AppIcon name="star" size={18} fill="#ffdb3c" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#ffb691] uppercase font-bold">Total Stars</span>
                <span className="text-[14px] font-black text-[#ffdb3c] font-hud">
                  {player.stars} ⭐
                </span>
              </div>
            </div>

            <div className="bg-[#2b0e3b] p-2.5 rounded-xl border border-[#ff6f00]/20 flex items-center gap-2.5 shadow">
              <div className="w-8 h-8 rounded-lg bg-[#3a1d4a] flex items-center justify-center text-[#ffe16d] shrink-0">
                <AppIcon name="emoji_events" size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#ffb691] uppercase font-bold">Best Score</span>
                <span className="text-[13px] font-black text-white font-hud truncate">
                  {player.highScore?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            <div className="bg-[#2b0e3b] p-2.5 rounded-xl border border-[#ff6f00]/20 flex items-center gap-2.5 shadow">
              <div className="w-8 h-8 rounded-lg bg-[#3a1d4a] flex items-center justify-center text-[#ff6689] shrink-0">
                <AppIcon name="favorite" size={18} fill="#ff6689" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#ffb691] uppercase font-bold">Lives</span>
                <span className="text-[14px] font-black text-white font-hud">
                  {player.lives} / {player.maxLives || 5}
                </span>
              </div>
            </div>
          </div>

          {/* Unlocked Divine Powers */}
          <div className="bg-[#2b0e3b] p-3 rounded-xl border border-[#ff6f00]/20 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-[#ffb691] uppercase tracking-wider">
              Unlocked Divine Powers
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(player.unlockedPowers || ['trident']).map((p) => (
                <span
                  key={p}
                  className="bg-[#3a1d4a] border border-[#ffdb3c]/40 text-[#ffdb3c] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow"
                >
                  ⚡ {p.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Logout Confirmation or Logout Button */}
          {!showLogoutConfirm ? (
            <button
              onClick={() => {
                playSound('click', player.soundEnabled);
                setShowLogoutConfirm(true);
              }}
              className="mt-1 w-full py-2.5 bg-[#3a1d4a] hover:bg-[#462856] text-[#ff6689] border border-[#ff6689]/30 hover:border-[#ff6689] font-display text-[12px] font-extrabold rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <AppIcon name="logout" size={16} />
              <span>LOG OUT OF GAME</span>
            </button>
          ) : (
            <div className="bg-[#3a1024] p-3 rounded-xl border border-[#ff6689]/60 flex flex-col gap-2 animate-fadeIn">
              <span className="text-[12px] text-white font-semibold text-center">
                Are you sure you want to log out? Your cloud progress is safely saved.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg bg-[#250818] text-gray-300 text-[11px] font-bold cursor-pointer"
                >
                  Stay Playing
                </button>
                <button
                  onClick={() => {
                    playSound('defeat', player.soundEnabled);
                    onLogout();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-[#ff6689] hover:bg-[#ff4d75] text-white text-[11px] font-black cursor-pointer shadow"
                >
                  Confirm Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
