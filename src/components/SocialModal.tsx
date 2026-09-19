import React, { useState, useEffect } from 'react';
import { PlayerProfile, FriendRecord, FriendRequest, LifeRequest } from '../types';
import { socialService } from '../services/socialService';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface SocialModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onLifeReceived?: () => void;
}

export const SocialModal: React.FC<SocialModalProps> = ({
  player,
  isOpen,
  onClose,
  onLifeReceived,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'lives'>('friends');
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; displayName: string; avatar?: string; currentLevel?: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Load friends and pending requests on open
  useEffect(() => {
    if (isOpen && player.id) {
      loadSocialData();
    }
  }, [isOpen, player.id]);

  const loadSocialData = async () => {
    if (!player.id) return;
    try {
      const [friendsList, requestsList] = await Promise.all([
        socialService.getFriends(player.id),
        socialService.getPendingFriendRequests(player.id),
      ]);
      setFriends(friendsList);
      setPendingRequests(requestsList);
    } catch (e) {
      console.error('Error loading social data:', e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !player.id) return;
    setIsSearching(true);
    setActionFeedback(null);
    try {
      const results = await socialService.searchPlayers(searchTerm, player.id);
      setSearchResults(results);
      if (results.length === 0) {
        setActionFeedback('No temple warriors found with that name.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetId: string, targetName: string) => {
    if (!player.id) return;
    playSound('click', player.soundEnabled);
    const res = await socialService.sendFriendRequest(
      player.id,
      player.displayName || player.name,
      targetId,
      targetName
    );
    setActionFeedback(res.message);
    if (res.success) {
      playSound('victory', player.soundEnabled);
    }
  };

  const handleRespondRequest = async (request: FriendRequest, accept: boolean) => {
    if (!player.id) return;
    playSound('click', player.soundEnabled);
    await socialService.respondToFriendRequest(
      request,
      accept,
      player.id,
      player.displayName || player.name
    );
    playSound(accept ? 'victory' : 'click', player.soundEnabled);
    loadSocialData();
  };

  const handleRequestLife = async (friend: FriendRecord) => {
    if (!player.id) return;
    playSound('click', player.soundEnabled);
    const res = await socialService.requestLife(
      player.id,
      player.displayName || player.name,
      friend.friendId,
      friend.friendName
    );
    setActionFeedback(res.message);
    if (res.success) {
      playSound('victory', player.soundEnabled);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-[420px] bg-[#1c012d] border border-[#ffdb3c]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[85vh]">
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

        {/* Tab Controls */}
        <div className="flex border-b border-[#3a1d4a] bg-[#140120]/70 p-1 shrink-0">
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              setActiveTab('friends');
              setActionFeedback(null);
            }}
            className={`flex-1 py-2 text-center text-[12px] font-display font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'friends' ? 'bg-[#ff6f00] text-white shadow' : 'text-[#ffb691] hover:text-white'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => {
              playSound('click', player.soundEnabled);
              setActiveTab('add');
              setActionFeedback(null);
            }}
            className={`flex-1 py-2 text-center text-[12px] font-display font-bold rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'add' ? 'bg-[#ff6f00] text-white shadow' : 'text-[#ffb691] hover:text-white'
            }`}
          >
            Add Warriors
            {pendingRequests.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#ff6689] animate-ping" />
            )}
          </button>
        </div>

        {/* Action feedback banner */}
        {actionFeedback && (
          <div className="mx-4 mt-3 bg-[#3a1d4a] border border-[#ffdb3c]/40 text-[#ffdb3c] px-3 py-2 rounded-xl text-[12px] flex items-center gap-2">
            <AppIcon name="info" size={14} className="shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div className="flex flex-col gap-2.5">
              {friends.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center gap-2 text-[#e1bfb0]">
                  <span className="text-3xl">🪔</span>
                  <p className="text-[13px] font-medium">No friends added yet.</p>
                  <p className="text-[11px] text-gray-400">
                    Switch to &ldquo;Add Warriors&rdquo; tab to invite other temple players!
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-2 px-3 py-1.5 bg-[#ff6f00] text-white rounded-lg text-[11px] font-bold shadow cursor-pointer"
                  >
                    Find Warriors
                  </button>
                </div>
              ) : (
                friends.map((f) => (
                  <div
                    key={f.id}
                    className="bg-[#2b0e3b] p-3 rounded-2xl border border-[#ff6f00]/20 flex items-center justify-between gap-2 shadow"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#3a1d4a] border border-[#ffdb3c]/30 flex items-center justify-center text-[#ffdb3c] font-black text-sm shrink-0">
                        {f.friendName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-display text-[13px] font-extrabold text-white truncate">
                          {f.friendName}
                        </span>
                        <span className="text-[10px] text-[#ffb691]">
                          Temple Friend • Active
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRequestLife(f)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#3a1d4a] hover:bg-[#462856] text-[#ff6689] border border-[#ff6689]/40 hover:border-[#ff6689] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow shrink-0"
                      title="Request a Life"
                    >
                      <AppIcon name="favorite" size={13} fill="#ff6689" />
                      <span>Request Life</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ADD WARRIORS & PENDING REQUESTS */}
          {activeTab === 'add' && (
            <div className="flex flex-col gap-4">
              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#ffdb3c] uppercase tracking-wider">
                    Incoming Requests ({pendingRequests.length})
                  </span>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#3a1d4a] p-2.5 rounded-xl border border-[#ffdb3c]/40 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#462856] flex items-center justify-center text-[#ffdb3c] font-bold text-xs">
                          {req.senderName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[12px] text-white truncate">
                            {req.senderName}
                          </span>
                          <span className="text-[9px] text-[#e1bfb0]">Wants to connect</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRespondRequest(req, true)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold cursor-pointer shadow"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req, false)}
                          className="px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Box */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search player name..."
                  className="flex-1 bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2 text-[12px] text-white placeholder-gray-400 outline-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-3 py-2 bg-[#ff6f00] hover:bg-[#ff8017] text-white rounded-xl text-[12px] font-bold shadow cursor-pointer active:scale-95 transition-all shrink-0 flex items-center gap-1"
                >
                  <AppIcon name="search" size={14} />
                  <span>Search</span>
                </button>
              </form>

              {/* Search Results */}
              <div className="flex flex-col gap-2">
                {searchResults.map((res) => (
                  <div
                    key={res.id}
                    className="bg-[#2b0e3b] p-2.5 rounded-xl border border-[#ff6f00]/20 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#3a1d4a] flex items-center justify-center text-[#ffdb3c] font-bold text-xs">
                        {res.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[12px] text-white truncate">
                          {res.displayName}
                        </span>
                        <span className="text-[10px] text-[#ffb691]">
                          Level {res.currentLevel || 1}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(res.id, res.displayName)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#ff6f00] hover:bg-[#ff8017] text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow active:scale-95"
                    >
                      <AppIcon name="person_add" size={12} />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
