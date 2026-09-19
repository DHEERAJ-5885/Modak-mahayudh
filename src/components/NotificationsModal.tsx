import React, { useState } from 'react';
import { GameNotification, PlayerProfile } from '../types';
import { socialService } from '../services/socialService';
import { playerService } from '../services/playerService';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface NotificationsModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  notifications: GameNotification[];
  onRefreshNotifications: () => void;
  onUpdatePlayer?: (player: PlayerProfile) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  player,
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications,
  onUpdatePlayer,
}) => {
  const [actingNotifId, setActingNotifId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    if (!player.id) return;
    playSound('click', player.soundEnabled);
    await socialService.markAllNotificationsRead(player.id);
    onRefreshNotifications();
  };

  const handleSendLifeToFriend = async (notif: GameNotification) => {
    if (!player.id || !notif.relatedPlayerId) return;
    setActingNotifId(notif.id);
    try {
      playSound('click', player.soundEnabled);
      const res = await socialService.sendLife(
        notif.id,
        player.id,
        player.displayName || player.name,
        notif.relatedPlayerId
      );
      setFeedback(res.message);
      playSound('victory', player.soundEnabled);
      await socialService.markNotificationRead(notif.id);
      onRefreshNotifications();
    } catch (e: any) {
      setFeedback(e.message || 'Could not send life.');
    } finally {
      setActingNotifId(null);
    }
  };

  const handleClaimLife = async (notif: GameNotification) => {
    if (!player.id) return;
    setActingNotifId(notif.id);
    try {
      playSound('click', player.soundEnabled);
      const newLives = await playerService.addLife(player.id, player.lives, 5);
      const updatedPlayer = { ...player, lives: newLives };
      if (onUpdatePlayer) {
        onUpdatePlayer(updatedPlayer);
      }
      setFeedback('Sacred Life claimed! (+1 ❤️)');
      playSound('victory', player.soundEnabled);
      await socialService.markNotificationRead(notif.id);
      onRefreshNotifications();
    } catch (e: any) {
      setFeedback(e.message || 'Could not claim life.');
    } finally {
      setActingNotifId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-[400px] bg-[#1c012d] border border-[#ffdb3c]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#2b0e3b] via-[#3a1d4a] to-[#2b0e3b] p-4 flex items-center justify-between border-b border-[#ff6f00]/30 shrink-0">
          <div className="flex items-center gap-2">
            <AppIcon name="notifications" size={20} className="text-[#ffdb3c]" fill="#ffdb3c" />
            <h2 className="font-display text-[16px] font-black text-[#ffdb3c] tracking-tight">
              Temple Notifications
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#ffb691] hover:text-[#ffdb3c] underline cursor-pointer"
              >
                Mark Read
              </button>
            )}
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
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mx-4 mt-3 bg-[#1e3b2b] border border-emerald-500/50 text-emerald-200 px-3 py-2 rounded-xl text-[12px] flex items-center gap-2">
            <AppIcon name="check_circle" size={15} className="text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-2 text-[#e1bfb0]">
              <span className="text-3xl">🔔</span>
              <p className="text-[13px] font-medium">No new notifications.</p>
              <p className="text-[11px] text-gray-400">
                You will be notified of friend requests, life gifts, and temple events here!
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.read;
              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isUnread
                      ? 'bg-[#3a1d4a] border-[#ffdb3c]/40 shadow-md'
                      : 'bg-[#250838] border-[#ff6f00]/15 opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#462856] flex items-center justify-center text-[#ffdb3c] shrink-0 mt-0.5">
                        {n.type === 'life_request' ? (
                          <AppIcon name="favorite" size={14} className="text-[#ff6689]" fill="#ff6689" />
                        ) : n.type === 'life_sent' ? (
                          <AppIcon name="volunteer_activism" size={14} className="text-[#ff6689]" />
                        ) : n.type === 'friend_request' || n.type === 'friend_accepted' ? (
                          <AppIcon name="person" size={14} className="text-[#ffdb3c]" />
                        ) : (
                          <AppIcon name="notifications" size={14} className="text-[#ffdb3c]" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-semibold text-white leading-snug">
                          {n.message}
                        </span>
                        <span className="text-[10px] text-[#ffb691]/70 mt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#ffdb3c] shrink-0 mt-1" />
                    )}
                  </div>

                  {/* If this is a life request, provide a 1-click [SEND LIFE ❤️] button! */}
                  {n.type === 'life_request' && n.relatedPlayerId && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleSendLifeToFriend(n)}
                        disabled={actingNotifId === n.id}
                        className="px-3 py-1 bg-gradient-to-r from-[#ff6f00] to-[#ff4d75] hover:brightness-110 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <AppIcon name="favorite" size={12} fill="white" />
                        <span>{actingNotifId === n.id ? 'SENDING...' : 'SEND LIFE ❤️'}</span>
                      </button>
                    </div>
                  )}

                  {/* If a friend sent a life gift, provide a 1-click [CLAIM LIFE ❤️ (+1)] button! */}
                  {n.type === 'life_sent' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleClaimLife(n)}
                        disabled={actingNotifId === n.id || player.lives >= (player.maxLives || 5)}
                        className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <AppIcon name="favorite" size={12} fill="white" />
                        <span>
                          {actingNotifId === n.id
                            ? 'CLAIMING...'
                            : player.lives >= (player.maxLives || 5)
                            ? 'LIVES FULL'
                            : 'CLAIM LIFE (+1 ❤️)'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
