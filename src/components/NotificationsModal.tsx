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
  onShowToast?: (message: string, icon?: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  player,
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications,
  onUpdatePlayer,
  onShowToast,
}) => {
  const [actingNotifId, setActingNotifId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUserId = player.id || 'player_aryan_01';
  const currentUserName = player.displayName || player.name || 'Bhakta';

  const handleMarkAllRead = async () => {
    playSound('click', player.soundEnabled);
    await socialService.markAllNotificationsRead(currentUserId);
    onRefreshNotifications();
  };

  // Section 8: Send Life in response to Life Request
  const handleSendLifeToFriend = async (notif: GameNotification) => {
    const targetId = notif.relatedPlayerId || 'usr_rahul';
    const targetName = notif.relatedPlayerName || 'Rahul';
    setActingNotifId(notif.id);

    try {
      playSound('click', player.soundEnabled);
      const res = await socialService.sendLife(
        currentUserId,
        currentUserName,
        targetId,
        targetName
      );

      playSound('victory', player.soundEnabled);
      onShowToast?.(`Life sent to ${targetName}!`, 'favorite');

      // Dismiss/fulfill notification
      await socialService.dismissNotification(currentUserId, notif.id);
      onRefreshNotifications();
    } catch (e: any) {
      onShowToast?.(e.message || 'Could not send life.', 'info');
    } finally {
      setActingNotifId(null);
    }
  };

  // Section 8: Ignore Life Request
  const handleIgnoreLifeRequest = async (notif: GameNotification) => {
    playSound('click', player.soundEnabled);
    await socialService.dismissNotification(currentUserId, notif.id);
    onShowToast?.('Request dismissed.', 'close');
    onRefreshNotifications();
  };

  // Claim life gift sent to current player
  const handleClaimLife = async (notif: GameNotification) => {
    setActingNotifId(notif.id);
    try {
      playSound('victory', player.soundEnabled);
      const newLives = await playerService.addLife(currentUserId, player.lives, player.maxLives || 5);
      if (onUpdatePlayer) {
        onUpdatePlayer({ ...player, lives: newLives });
      }
      onShowToast?.('Sacred Life claimed! (+1 ❤️)', 'favorite');
      await socialService.dismissNotification(currentUserId, notif.id);
      onRefreshNotifications();
    } catch (e: any) {
      onShowToast?.(e.message || 'Could not claim life.', 'info');
    } finally {
      setActingNotifId(null);
    }
  };

  const getNotifIcon = (type: GameNotification['type']) => {
    switch (type) {
      case 'life_request':
        return { name: 'favorite', color: '#ff6689', bg: 'bg-[#ff6689]/20' };
      case 'life_sent':
        return { name: 'volunteer_activism', color: '#ff6689', bg: 'bg-[#ff6689]/20' };
      case 'friend_request':
      case 'friend_accepted':
      case 'friend_invite':
        return { name: 'person_add', color: '#ffdb3c', bg: 'bg-[#ffdb3c]/20' };
      case 'achievement':
        return { name: 'emoji_events', color: '#ffe16d', bg: 'bg-[#ffe16d]/20' };
      case 'high_score':
        return { name: 'military_tech', color: '#ff9100', bg: 'bg-[#ff9100]/20' };
      default:
        return { name: 'notifications', color: '#ffdb3c', bg: 'bg-[#ffdb3c]/20' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-[420px] bg-[#1c012d] border border-[#ffdb3c]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[82vh]">
        {/* Header */}
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
                className="text-[11px] text-[#ffb691] hover:text-[#ffdb3c] font-bold underline cursor-pointer"
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

        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2 text-[#e1bfb0]">
              <span className="text-4xl">🔔</span>
              <p className="text-[14px] font-bold text-white">No new notifications</p>
              <p className="text-[11px] text-gray-400 max-w-xs">
                You will be notified of friend requests, life gifts, and temple achievements here!
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.read;
              const iconInfo = getNotifIcon(n.type);

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    isUnread
                      ? 'bg-[#361647] border-[#ffdb3c]/50 shadow-md'
                      : 'bg-[#240833] border-white/10 opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl ${iconInfo.bg} flex items-center justify-center shrink-0 mt-0.5 border border-white/10`}
                      >
                        <AppIcon name={iconInfo.name} size={16} fill={iconInfo.color} className="text-white" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold text-white leading-snug">
                          {n.message}
                        </span>
                        <span className="text-[10px] text-[#ffb691]/80 mt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffdb3c] shrink-0 mt-1 shadow" />
                    )}
                  </div>

                  {/* Life Request Action: [Send Life] and [Ignore] */}
                  {n.type === 'life_request' && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => handleIgnoreLifeRequest(n)}
                        disabled={actingNotifId === n.id}
                        className="px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-gray-300 text-[11px] font-bold cursor-pointer active:scale-95 transition"
                      >
                        Ignore
                      </button>
                      <button
                        onClick={() => handleSendLifeToFriend(n)}
                        disabled={actingNotifId === n.id}
                        className="px-3 py-1 bg-gradient-to-r from-[#ff4d75] to-[#ff6f00] hover:brightness-110 text-white rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <AppIcon name="favorite" size={12} fill="white" />
                        <span>{actingNotifId === n.id ? 'Sending...' : 'Send Life ❤️'}</span>
                      </button>
                    </div>
                  )}

                  {/* Life Sent to Current Player: [Claim Life (+1 ❤️)] */}
                  {n.type === 'life_sent' && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => handleClaimLife(n)}
                        disabled={actingNotifId === n.id || player.lives >= (player.maxLives || 5)}
                        className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <AppIcon name="favorite" size={12} fill="white" />
                        <span>
                          {actingNotifId === n.id
                            ? 'Claiming...'
                            : player.lives >= (player.maxLives || 5)
                            ? 'Lives Full'
                            : 'Claim Life (+1 ❤️)'}
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
