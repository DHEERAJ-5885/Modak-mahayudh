import React, { useState, useEffect } from 'react';
import { PlayerProfile, FriendRecord, FriendRequest } from '../types';
import { socialService, SUGGESTED_PLAYERS } from '../services/socialService';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

export type SocialTab = 'friends' | 'invite' | 'request_lives';

interface SocialModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SocialTab;
  onShowToast: (message: string, icon?: string) => void;
}

export const SocialModal: React.FC<SocialModalProps> = ({
  player,
  isOpen,
  onClose,
  initialTab = 'friends',
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<SocialTab>(initialTab);
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [invitedPlayerIds, setInvitedPlayerIds] = useState<string[]>([]);
  const [requestedFriendIds, setRequestedFriendIds] = useState<string[]>([]);
  const [sentLifeFriendIds, setSentLifeFriendIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadAllData();
    }
  }, [isOpen, initialTab]);

  const loadAllData = async () => {
    const userId = player.id || 'player_aryan_01';
    setIsLoading(true);
    try {
      const [fList, rList, invIds, reqIds, sentIds] = await Promise.all([
        socialService.getFriends(userId),
        socialService.getPendingFriendRequests(userId),
        socialService.getInvitedPlayerIds(userId),
        socialService.getRequestedFriendIds(userId),
        socialService.getSentLifeFriendIds(userId),
      ]);
      setFriends(fList);
      setPendingRequests(rList);
      setInvitedPlayerIds(invIds);
      setRequestedFriendIds(reqIds);
      setSentLifeFriendIds(sentIds);
    } catch (e) {
      console.error('Error loading social data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentUserId = player.id || 'player_aryan_01';
  const currentUserName = player.displayName || player.name || 'Bhakta';

  // Section 10: Friend Life Giving
  const handleSendLife = async (friend: FriendRecord) => {
    playSound('click', player.soundEnabled);
    const res = await socialService.sendLife(
      currentUserId,
      currentUserName,
      friend.friendId,
      friend.friendName
    );

    if (res.success) {
      setSentLifeFriendIds((prev) => [...prev, friend.friendId]);
      playSound('victory', player.soundEnabled);
      onShowToast(`Life sent to ${friend.friendName}!`, 'favorite');
    } else {
      onShowToast(res.message, 'info');
    }
  };

  // Section 3: Friend Requests Accept / Decline
  const handleRespondRequest = async (request: FriendRequest, accept: boolean) => {
    playSound('click', player.soundEnabled);
    const result = await socialService.respondToFriendRequest(
      request,
      accept,
      currentUserId,
      currentUserName
    );

    setFriends(result.newFriends);
    setPendingRequests(result.newRequests);

    if (accept) {
      playSound('victory', player.soundEnabled);
      onShowToast(`Accepted ${request.senderName}'s friend request!`, 'check_circle');
    } else {
      onShowToast(`Declined friend request.`, 'close');
    }
  };

  // Section 4: Invite Friends
  const handleInvite = async (targetId: string, targetName: string) => {
    playSound('click', player.soundEnabled);
    const res = await socialService.inviteFriend(
      currentUserId,
      targetId,
      targetName
    );

    if (res.success) {
      setInvitedPlayerIds((prev) => [...prev, targetId]);
      playSound('victory', player.soundEnabled);
      onShowToast('Invitation sent!', 'mail');
    } else {
      onShowToast(res.message, 'info');
    }
  };

  // Section 7: Request Lives
  const handleRequestLife = async (friend: FriendRecord) => {
    playSound('click', player.soundEnabled);
    const res = await socialService.requestLife(
      currentUserId,
      currentUserName,
      friend.friendId,
      friend.friendName
    );

    if (res.success) {
      setRequestedFriendIds((prev) => [...prev, friend.friendId]);
      playSound('victory', player.soundEnabled);
      onShowToast(`Life request sent to ${friend.friendName}!`, 'volunteer_activism');
    } else {
      onShowToast(res.message, 'info');
    }
  };

  // Filter suggested players in Invite Tab by search input
  const filteredSuggested = SUGGESTED_PLAYERS.filter((p) => {
    const matchesSearch = searchTerm.trim()
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      : true;
    const notAlreadyFriend = !friends.some((f) => f.friendId === p.id);
    return matchesSearch && notAlreadyFriend;
  });

  const getAvatarIcon = (avatar?: string) => {
    switch (avatar) {
      case 'mushak':
        return { name: 'pets', color: '#ffb691' };
      case 'lotus':
        return { name: 'spa', color: '#ff6689' };
      case 'trident':
        return { name: 'flash_on', color: '#ffdb3c' };
      case 'diya':
        return { name: 'wb_incandescent', color: '#ffe16d' };
      default:
        return { name: 'temple_hindu', color: '#ffdb3c' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-[430px] bg-[#1c012d] border border-[#ffdb3c]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#2b0e3b] via-[#3a1d4a] to-[#2b0e3b] p-4 flex items-center justify-between border-b border-[#ff6f00]/30 shrink-0">
          <div className="flex items-center gap-2">
            <AppIcon name="group" size={20} className="text-[#ffdb3c]" />
            <h2 className="font-display text-[16px] font-black text-[#ffdb3c] tracking-tight">
              Temple Friends & Sangha
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

        {/* Tab Controls: Friends, Invite Friends, Request Lives */}
        <div className="flex border-b border-[#3a1d4a] bg-[#140120]/80 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              setActiveTab('friends');
            }}
            className={`flex-1 py-2 px-1 text-center text-[11px] sm:text-[12px] font-display font-extrabold rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-[#ff9100] to-[#ff6f00] text-white shadow'
                : 'text-[#ffb691] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>My Friends ({friends.length})</span>
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#ff4d75] text-[9px] text-white font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              setActiveTab('invite');
            }}
            className={`flex-1 py-2 px-1 text-center text-[11px] sm:text-[12px] font-display font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === 'invite'
                ? 'bg-gradient-to-r from-[#ff9100] to-[#ff6f00] text-white shadow'
                : 'text-[#ffb691] hover:text-white hover:bg-white/5'
            }`}
          >
            Invite Friends
          </button>

          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              setActiveTab('request_lives');
            }}
            className={`flex-1 py-2 px-1 text-center text-[11px] sm:text-[12px] font-display font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === 'request_lives'
                ? 'bg-gradient-to-r from-[#ff4d75] to-[#ff6f00] text-white shadow'
                : 'text-[#ffb691] hover:text-white hover:bg-white/5'
            }`}
          >
            Request Lives ❤️
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* TAB 1: FRIENDS SYSTEM (My Friends + Friend Requests) */}
          {activeTab === 'friends' && (
            <div className="flex flex-col gap-4">
              {/* SECTION: FRIEND REQUESTS */}
              {pendingRequests.length > 0 && (
                <div className="flex flex-col gap-2 bg-[#260933] p-3 rounded-2xl border border-[#ffdb3c]/40 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#ffdb3c] uppercase tracking-wider flex items-center gap-1.5">
                      <AppIcon name="person_add" size={13} className="text-[#ffdb3c]" />
                      Friend Requests ({pendingRequests.length})
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-[#3a1d4a] p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#462856] flex items-center justify-center text-[#ffdb3c] font-bold text-xs shrink-0">
                            {req.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-display font-extrabold text-[12px] text-white truncate">
                              {req.senderName}
                            </span>
                            <span className="text-[9px] text-[#e1bfb0]">Incoming Request</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRespondRequest(req, true)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[10px] font-black cursor-pointer shadow transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondRequest(req, false)}
                            className="px-2 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 active:scale-95 text-gray-300 text-[10px] font-bold cursor-pointer transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: MY FRIENDS */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[13px] font-extrabold text-[#ffdb3c] uppercase tracking-wider">
                    My Friends
                  </h3>
                  <span className="text-[10px] text-[#ffb691] font-hud">
                    {friends.length} Connected
                  </span>
                </div>

                {friends.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2 text-[#e1bfb0] bg-[#250838] rounded-2xl p-4 border border-white/5">
                    <span className="text-3xl">🪔</span>
                    <p className="text-[13px] font-bold text-white">No temple friends yet.</p>
                    <p className="text-[11px] text-[#e1bfb0]">
                      Invite other devotees from the &ldquo;Invite Friends&rdquo; tab to give and receive lives!
                    </p>
                    <button
                      onClick={() => setActiveTab('invite')}
                      className="mt-2 px-3.5 py-1.5 bg-[#ff6f00] text-white rounded-xl text-[11px] font-black shadow cursor-pointer active:scale-95"
                    >
                      Invite Friends Now
                    </button>
                  </div>
                ) : (
                  friends.map((f) => {
                    const avatar = getAvatarIcon(f.friendAvatar);
                    const hasSentToday = sentLifeFriendIds.includes(f.friendId);

                    return (
                      <div
                        key={f.id}
                        className="bg-[#2b0e3b] p-3 rounded-2xl border border-[#ff6f00]/20 flex items-center justify-between gap-2 shadow"
                      >
                        {/* Avatar, Name, Status, Score */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-[#462856] border border-[#ffdb3c]/30 flex items-center justify-center shrink-0 shadow-inner">
                              <AppIcon name={avatar.name} size={18} className="text-white" fill={avatar.color} />
                            </div>
                            {/* Online / Offline status */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b0e3b] ${
                                f.isOnline !== false ? 'bg-emerald-400' : 'bg-gray-500'
                              }`}
                              title={f.isOnline !== false ? 'Online' : 'Offline'}
                            />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-display text-[13px] font-extrabold text-white truncate">
                              {f.friendName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#e1bfb0]">
                              <span className={f.isOnline !== false ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                                {f.isOnline !== false ? '● Online' : '○ Offline'}
                              </span>
                              <span>•</span>
                              <span className="text-[#ffe16d] font-hud">
                                {f.highScore ? `${f.highScore.toLocaleString()} pts` : `Lvl ${f.friendLevel || 1}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Send Life Button (from Section 10: Friend Life Giving) */}
                        <button
                          onClick={() => handleSendLife(f)}
                          disabled={hasSentToday}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow transition-all shrink-0 ${
                            hasSentToday
                              ? 'bg-[#3a1d4a] text-gray-400 border border-white/10 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-r from-[#ff4d75] to-[#ff6f00] text-white hover:brightness-110 active:scale-95 cursor-pointer'
                          }`}
                        >
                          <AppIcon name="favorite" size={13} fill="currentColor" />
                          <span>{hasSentToday ? 'Sent ❤️' : 'Send Life'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INVITE FRIENDS */}
          {activeTab === 'invite' && (
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-display text-[14px] font-extrabold text-[#ffdb3c]">
                  Invite friends to play!
                </h3>
                <p className="font-body text-[11px] text-[#e1bfb0]">
                  Share the festive spirit of Ganesh Chaturthi and earn blessings together.
                </p>
              </div>

              {/* Search Field */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search player name..."
                  className="w-full bg-[#240833] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl pl-9 pr-3 py-2 text-[12px] text-white placeholder-gray-400 outline-none shadow-inner"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <AppIcon name="search" size={15} />
                </div>
              </div>

              {/* Player list */}
              <div className="flex flex-col gap-2 mt-1">
                {filteredSuggested.length === 0 ? (
                  <div className="py-6 text-center text-[#e1bfb0] text-[12px]">
                    No devotees found matching &ldquo;{searchTerm}&rdquo;.
                  </div>
                ) : (
                  filteredSuggested.map((p) => {
                    const isInvited = invitedPlayerIds.includes(p.id);
                    const avatar = getAvatarIcon(p.avatar);

                    return (
                      <div
                        key={p.id}
                        className="bg-[#2b0e3b] p-2.5 rounded-2xl border border-white/10 flex items-center justify-between gap-2 shadow"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#462856] border border-[#ffdb3c]/30 flex items-center justify-center text-white shrink-0">
                            <AppIcon name={avatar.name} size={16} fill={avatar.color} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-display text-[12px] font-extrabold text-white truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-[#ffb691] font-hud">
                              Level {p.level} • {p.score.toLocaleString()} pts
                            </span>
                          </div>
                        </div>

                        {/* Invite Button -> Turns into Invited */}
                        <button
                          onClick={() => handleInvite(p.id, p.name)}
                          disabled={isInvited}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 shadow transition-all shrink-0 ${
                            isInvited
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#ff9100] to-[#ff6f00] text-white hover:brightness-110 active:scale-95 cursor-pointer'
                          }`}
                        >
                          <AppIcon name={isInvited ? 'check' : 'person_add'} size={13} />
                          <span>{isInvited ? 'Invited' : 'Invite'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REQUEST LIVES */}
          {activeTab === 'request_lives' && (
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-display text-[14px] font-extrabold text-[#ff4d75] flex items-center gap-1.5">
                  <AppIcon name="volunteer_activism" size={16} className="text-[#ff4d75]" />
                  Request Lives from Friends
                </h3>
                <p className="font-body text-[11px] text-[#e1bfb0]">
                  Ask temple companions to send you sacred hearts so you can keep playing.
                </p>
              </div>

              {friends.length === 0 ? (
                <div className="py-6 text-center text-[#e1bfb0] text-[12px] bg-[#250838] rounded-2xl p-4">
                  <p className="font-bold text-white mb-1">No friends to request from!</p>
                  <p className="text-[11px] mb-3">Add or invite friends first to ask for lives.</p>
                  <button
                    onClick={() => setActiveTab('invite')}
                    className="px-3.5 py-1.5 bg-[#ff6f00] text-white rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    Go to Invite Friends
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {friends.map((f) => {
                    const isRequested = requestedFriendIds.includes(f.friendId);
                    const avatar = getAvatarIcon(f.friendAvatar);

                    return (
                      <div
                        key={f.id}
                        className="bg-[#2b0e3b] p-3 rounded-2xl border border-white/10 flex items-center justify-between gap-2 shadow"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#462856] border border-[#ffdb3c]/30 flex items-center justify-center shrink-0">
                            <AppIcon name={avatar.name} size={16} fill={avatar.color} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-display text-[13px] font-extrabold text-white truncate">
                              {f.friendName}
                            </span>
                            <span className="text-[10px] text-[#e1bfb0]">
                              {f.isOnline !== false ? '● Active' : '○ Offline'}
                            </span>
                          </div>
                        </div>

                        {/* Request Button -> Turns into Requested */}
                        <button
                          onClick={() => handleRequestLife(f)}
                          disabled={isRequested}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow transition-all shrink-0 ${
                            isRequested
                              ? 'bg-[#3a1d4a] text-gray-400 border border-white/10 cursor-not-allowed opacity-70'
                              : 'bg-gradient-to-r from-[#ff4d75] to-[#ff6f00] text-white hover:brightness-110 active:scale-95 cursor-pointer'
                          }`}
                        >
                          <AppIcon name={isRequested ? 'check' : 'favorite'} size={13} fill="currentColor" />
                          <span>{isRequested ? 'Requested' : 'Request'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
