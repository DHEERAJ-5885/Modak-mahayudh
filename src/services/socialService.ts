import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FriendRecord,
  FriendRequest,
  LifeRequest,
  FriendInvite,
  GameNotification,
} from '../types';

const STORAGE_KEYS = {
  FRIENDS: 'vighna_friends_v4',
  FRIEND_REQUESTS: 'vighna_friend_requests_v4',
  LIFE_REQUESTS: 'vighna_life_requests_v4',
  INVITES: 'vighna_invites_v4',
  SENT_LIFE_TODAY: 'vighna_sent_life_today_v4',
  NOTIFICATIONS: 'vighna_notifications_v4',
};

// Initial pre-seeded mock friends
export const SEED_FRIENDS: FriendRecord[] = [
  {
    id: 'fr_seed_1',
    playerId: 'current_player',
    friendId: 'usr_aarav',
    friendName: 'Aarav Patel',
    friendAvatar: 'ganesha',
    friendLevel: 8,
    friendStars: 24,
    highScore: 48250,
    isOnline: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'fr_seed_2',
    playerId: 'current_player',
    friendId: 'usr_rahul',
    friendName: 'Rahul Sharma',
    friendAvatar: 'lotus',
    friendLevel: 6,
    friendStars: 18,
    highScore: 42900,
    isOnline: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'fr_seed_3',
    playerId: 'current_player',
    friendId: 'usr_ananya',
    friendName: 'Ananya Deshmukh',
    friendAvatar: 'diya',
    friendLevel: 5,
    friendStars: 15,
    highScore: 38700,
    isOnline: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// Initial pre-seeded incoming friend requests
export const SEED_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'freq_seed_1',
    senderId: 'usr_rohan',
    senderName: 'Rohan Kulkarni',
    senderAvatar: 'mushak',
    receiverId: 'current_player',
    receiverName: 'Bhakta',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'freq_seed_2',
    senderId: 'usr_meera',
    senderName: 'Meera Iyer',
    senderAvatar: 'lotus',
    receiverId: 'current_player',
    receiverName: 'Bhakta',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

// Suggested players for Invite Friends
export const SUGGESTED_PLAYERS = [
  { id: 'usr_vikram', name: 'Vikramaditya S.', avatar: 'trident', level: 7, score: 36400 },
  { id: 'usr_devendra', name: 'Devendra Rao', avatar: 'mushak', level: 5, score: 31800 },
  { id: 'usr_pooja', name: 'Pooja Verma', avatar: 'lotus', level: 4, score: 29500 },
  { id: 'usr_sid', name: 'Siddharth Joshi', avatar: 'ganesha', level: 6, score: 33200 },
  { id: 'usr_tanvi', name: 'Tanvi Kulkarni', avatar: 'diya', level: 3, score: 24100 },
  { id: 'usr_aditya', name: 'Aditya Narayan', avatar: 'trident', level: 5, score: 30500 },
];

// Seed notifications
export const SEED_NOTIFICATIONS: GameNotification[] = [
  {
    id: 'notif_seed_1',
    recipientId: 'current_player',
    type: 'life_request',
    message: 'Rahul requested a life from you.',
    read: false,
    relatedPlayerId: 'usr_rahul',
    relatedPlayerName: 'Rahul Sharma',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'notif_seed_2',
    recipientId: 'current_player',
    type: 'life_sent',
    message: 'Ananya sent you a life ❤️',
    read: false,
    relatedPlayerId: 'usr_ananya',
    relatedPlayerName: 'Ananya Deshmukh',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'notif_seed_3',
    recipientId: 'current_player',
    type: 'friend_request',
    message: 'Rohan Kulkarni sent you a friend request!',
    read: false,
    relatedPlayerId: 'usr_rohan',
    relatedPlayerName: 'Rohan Kulkarni',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'notif_seed_4',
    recipientId: 'current_player',
    type: 'achievement',
    message: 'Temple Devotion: Daily streak reached 3 days! 🪔',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

export const socialService = {
  // ----------------------------------------------------
  // FRIENDS
  // ----------------------------------------------------

  async getFriends(userId: string): Promise<FriendRecord[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.FRIENDS}_${userId || 'default'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    // Return realistic seed friends
    const seeds = SEED_FRIENDS.map((f) => ({ ...f, playerId: userId }));
    this.saveFriends(userId, seeds);
    return seeds;
  },

  saveFriends(userId: string, friends: FriendRecord[]): void {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.FRIENDS}_${userId || 'default'}`,
        JSON.stringify(friends)
      );
    } catch {
      // ignore
    }
  },

  // ----------------------------------------------------
  // FRIEND REQUESTS
  // ----------------------------------------------------

  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.FRIEND_REQUESTS}_${userId || 'default'}`);
      if (raw) {
        const parsed: FriendRequest[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((r) => r.status === 'pending');
        }
      }
    } catch {
      // fallback
    }

    const seeds = SEED_FRIEND_REQUESTS.map((r) => ({ ...r, receiverId: userId }));
    this.saveFriendRequests(userId, seeds);
    return seeds;
  },

  saveFriendRequests(userId: string, requests: FriendRequest[]): void {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.FRIEND_REQUESTS}_${userId || 'default'}`,
        JSON.stringify(requests)
      );
    } catch {
      // ignore
    }
  },

  async respondToFriendRequest(
    request: FriendRequest,
    accept: boolean,
    currentUserId: string,
    currentUserName: string
  ): Promise<{ success: boolean; newFriends: FriendRecord[]; newRequests: FriendRequest[] }> {
    const allRequests = await this.getPendingFriendRequests(currentUserId);
    const updatedRequests = allRequests.filter((r) => r.id !== request.id);
    this.saveFriendRequests(currentUserId, updatedRequests);

    let updatedFriends = await this.getFriends(currentUserId);

    if (accept) {
      const newFriend: FriendRecord = {
        id: `fr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        playerId: currentUserId,
        friendId: request.senderId,
        friendName: request.senderName,
        friendAvatar: request.senderAvatar || 'ganesha',
        friendLevel: 4,
        friendStars: 10,
        highScore: 32000,
        isOnline: true,
        createdAt: new Date().toISOString(),
      };

      // Add to friends if not already present
      if (!updatedFriends.some((f) => f.friendId === request.senderId)) {
        updatedFriends = [newFriend, ...updatedFriends];
        this.saveFriends(currentUserId, updatedFriends);
      }

      // Add notification for current user
      await this.addNotification(currentUserId, {
        type: 'friend_accepted',
        message: `You and ${request.senderName} are now temple friends! 🕉️`,
        relatedPlayerId: request.senderId,
        relatedPlayerName: request.senderName,
      });

      // Also sync to Firestore if online
      try {
        await addDoc(collection(db, 'friends'), {
          playerId: currentUserId,
          friendId: request.senderId,
          friendName: request.senderName,
          friendAvatar: request.senderAvatar || 'ganesha',
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        // ignore offline
      }
    }

    return {
      success: true,
      newFriends: updatedFriends,
      newRequests: updatedRequests,
    };
  },

  // ----------------------------------------------------
  // INVITE FRIENDS
  // ----------------------------------------------------

  async getInvitedPlayerIds(userId: string): Promise<string[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.INVITES}_${userId || 'default'}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  },

  async inviteFriend(
    fromPlayerId: string,
    toPlayerId: string,
    toPlayerName: string,
    toPlayerAvatar?: string
  ): Promise<{ success: boolean; message: string }> {
    const invitedIds = await this.getInvitedPlayerIds(fromPlayerId);
    if (invitedIds.includes(toPlayerId)) {
      return { success: false, message: `${toPlayerName} is already invited!` };
    }

    invitedIds.push(toPlayerId);
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.INVITES}_${fromPlayerId || 'default'}`,
        JSON.stringify(invitedIds)
      );
    } catch {
      // ignore
    }

    // Try Firestore sync
    try {
      await addDoc(collection(db, 'invitations'), {
        fromPlayerId,
        toPlayerId,
        toPlayerName,
        status: 'invited',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      // ignore offline
    }

    return { success: true, message: 'Invitation sent!' };
  },

  // ----------------------------------------------------
  // REQUEST LIVES
  // ----------------------------------------------------

  async getRequestedFriendIds(fromPlayerId: string): Promise<string[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.LIFE_REQUESTS}_${fromPlayerId || 'default'}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  },

  async requestLife(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string
  ): Promise<{ success: boolean; message: string; request?: LifeRequest }> {
    const requestedIds = await this.getRequestedFriendIds(senderId);
    if (requestedIds.includes(receiverId)) {
      return { success: false, message: `Life request already sent to ${receiverName}!` };
    }

    requestedIds.push(receiverId);
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.LIFE_REQUESTS}_${senderId || 'default'}`,
        JSON.stringify(requestedIds)
      );
    } catch {
      // ignore
    }

    const lifeRequest: LifeRequest = {
      id: `request-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      fromPlayerId: senderId,
      toPlayerId: receiverId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      type: 'life',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Add notification for receiver (if same device or mock test)
    await this.addNotification(receiverId, {
      type: 'life_request',
      message: `${senderName} requested a life from you.`,
      relatedPlayerId: senderId,
      relatedPlayerName: senderName,
    });

    // Firestore sync if connected
    try {
      await addDoc(collection(db, 'life_requests'), lifeRequest);
    } catch (e) {
      // ignore offline
    }

    return {
      success: true,
      message: `Life request sent to ${receiverName}!`,
      request: lifeRequest,
    };
  },

  // ----------------------------------------------------
  // FRIEND LIFE GIVING (SEND LIFE TO FRIEND)
  // ----------------------------------------------------

  async getSentLifeFriendIds(senderId: string): Promise<string[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.SENT_LIFE_TODAY}_${senderId || 'default'}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  },

  async sendLife(
    senderId: string,
    senderName: string,
    targetPlayerId: string,
    targetPlayerName: string
  ): Promise<{ success: boolean; message: string }> {
    const sentList = await this.getSentLifeFriendIds(senderId);
    if (sentList.includes(targetPlayerId)) {
      return { success: false, message: `You already sent a life to ${targetPlayerName} today!` };
    }

    sentList.push(targetPlayerId);
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.SENT_LIFE_TODAY}_${senderId || 'default'}`,
        JSON.stringify(sentList)
      );
    } catch {
      // ignore
    }

    // Add notification for recipient
    await this.addNotification(targetPlayerId, {
      type: 'life_sent',
      message: `${senderName} sent you a life ❤️`,
      relatedPlayerId: senderId,
      relatedPlayerName: senderName,
    });

    // Firestore sync if connected
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId: targetPlayerId,
        type: 'life_sent',
        message: `${senderName} sent you a life ❤️`,
        read: false,
        relatedPlayerId: senderId,
        relatedPlayerName: senderName,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      // ignore offline
    }

    return { success: true, message: `Life sent to ${targetPlayerName}!` };
  },

  // ----------------------------------------------------
  // NOTIFICATIONS SYSTEM
  // ----------------------------------------------------

  async getNotifications(userId: string): Promise<GameNotification[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.NOTIFICATIONS}_${userId || 'default'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    const seeds = SEED_NOTIFICATIONS.map((n) => ({ ...n, recipientId: userId }));
    this.saveNotifications(userId, seeds);
    return seeds;
  },

  saveNotifications(userId: string, notifs: GameNotification[]): void {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.NOTIFICATIONS}_${userId || 'default'}`,
        JSON.stringify(notifs)
      );
    } catch {
      // ignore
    }
  },

  async addNotification(
    recipientId: string,
    data: {
      type: GameNotification['type'];
      message: string;
      relatedPlayerId?: string;
      relatedPlayerName?: string;
      relatedGameData?: any;
    }
  ): Promise<GameNotification> {
    const current = await this.getNotifications(recipientId);
    const newNotif: GameNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      recipientId,
      type: data.type,
      message: data.message,
      read: false,
      relatedPlayerId: data.relatedPlayerId,
      relatedPlayerName: data.relatedPlayerName,
      relatedGameData: data.relatedGameData,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotif, ...current];
    this.saveNotifications(recipientId, updated);
    return newNotif;
  },

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const current = await this.getNotifications(userId);
    const updated = current.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    this.saveNotifications(userId, updated);
  },

  async dismissNotification(userId: string, notificationId: string): Promise<void> {
    const current = await this.getNotifications(userId);
    const updated = current.filter((n) => n.id !== notificationId);
    this.saveNotifications(userId, updated);
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const current = await this.getNotifications(userId);
    const updated = current.map((n) => ({ ...n, read: true }));
    this.saveNotifications(userId, updated);
  },
};
