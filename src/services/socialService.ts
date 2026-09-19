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
import { FriendRecord, FriendRequest, LifeRequest, GameNotification } from '../types';
import { playerService } from './playerService';

export const socialService = {
  /**
   * Get confirmed friends for a player
   */
  async getFriends(userId: string): Promise<FriendRecord[]> {
    try {
      const q = query(
        collection(db, 'friends'),
        where('playerId', '==', userId)
      );
      const snap = await getDocs(q);
      const friends: FriendRecord[] = [];
      snap.forEach((d) => {
        friends.push({ id: d.id, ...d.data() } as FriendRecord);
      });
      return friends;
    } catch (err) {
      console.error('Error loading friends:', err);
      return [];
    }
  },

  /**
   * Search for other registered players by display name
   */
  async searchPlayers(searchTerm: string, currentUserId: string): Promise<Array<{ id: string; displayName: string; avatar?: string; currentLevel?: number }>> {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) return [];

    try {
      // Query players collection
      const q = query(collection(db, 'players'), limit(25));
      const snap = await getDocs(q);
      const results: Array<{ id: string; displayName: string; avatar?: string; currentLevel?: number }> = [];

      snap.forEach((d) => {
        if (d.id !== currentUserId) {
          const data = d.data();
          const name = (data.displayName || data.name || '').toLowerCase();
          if (name.includes(clean)) {
            results.push({
              id: d.id,
              displayName: data.displayName || data.name || 'Bhakta',
              avatar: data.avatar || 'ganesha',
              currentLevel: data.highestLevel || data.currentLevel || 1,
            });
          }
        }
      });
      return results;
    } catch (err) {
      console.error('Error searching players:', err);
      return [];
    }
  },

  /**
   * Send a friend request
   */
  async sendFriendRequest(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if already friends
      const friendsSnap = await getDocs(
        query(
          collection(db, 'friends'),
          where('playerId', '==', senderId),
          where('friendId', '==', receiverId)
        )
      );
      if (!friendsSnap.empty) {
        return { success: false, message: 'You are already friends with this player!' };
      }

      // Check if request already pending
      const reqSnap = await getDocs(
        query(
          collection(db, 'friend_requests'),
          where('senderId', '==', senderId),
          where('receiverId', '==', receiverId),
          where('status', '==', 'pending')
        )
      );
      if (!reqSnap.empty) {
        return { success: false, message: 'Friend request already sent and pending!' };
      }

      // Add request doc
      await addDoc(collection(db, 'friend_requests'), {
        senderId,
        senderName,
        receiverId,
        receiverName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // Send notification to recipient
      await addDoc(collection(db, 'notifications'), {
        recipientId: receiverId,
        type: 'friend_request',
        message: `${senderName} sent you a friend request! 🕉️`,
        read: false,
        relatedPlayerId: senderId,
        createdAt: new Date().toISOString(),
      });

      return { success: true, message: `Friend request sent to ${receiverName}!` };
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      return { success: false, message: err.message || 'Failed to send friend request.' };
    }
  },

  /**
   * Get pending friend requests for current user
   */
  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const q = query(
        collection(db, 'friend_requests'),
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      const requests: FriendRequest[] = [];
      snap.forEach((d) => {
        requests.push({ id: d.id, ...d.data() } as FriendRequest);
      });
      return requests;
    } catch (err) {
      console.error('Error loading friend requests:', err);
      return [];
    }
  },

  /**
   * Accept or reject a friend request
   */
  async respondToFriendRequest(
    request: FriendRequest,
    accept: boolean,
    currentUserId: string,
    currentUserName: string
  ): Promise<void> {
    try {
      const reqRef = doc(db, 'friend_requests', request.id);
      if (accept) {
        await updateDoc(reqRef, { status: 'accepted' });

        // Add bilateral friend records
        await addDoc(collection(db, 'friends'), {
          playerId: currentUserId,
          friendId: request.senderId,
          friendName: request.senderName,
          friendAvatar: request.senderAvatar || 'ganesha',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'friends'), {
          playerId: request.senderId,
          friendId: currentUserId,
          friendName: currentUserName,
          createdAt: new Date().toISOString(),
        });

        // Notify sender
        await addDoc(collection(db, 'notifications'), {
          recipientId: request.senderId,
          type: 'friend_accepted',
          message: `${currentUserName} accepted your friend request! 🙏`,
          read: false,
          relatedPlayerId: currentUserId,
          createdAt: new Date().toISOString(),
        });
      } else {
        await updateDoc(reqRef, { status: 'rejected' });
      }
    } catch (err) {
      console.error('Error responding to friend request:', err);
    }
  },

  /**
   * Request a life from a friend
   */
  async requestLife(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await addDoc(collection(db, 'life_requests'), {
        senderId,
        senderName,
        receiverId,
        receiverName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'notifications'), {
        recipientId: receiverId,
        type: 'life_request',
        message: `${senderName} requested a life! ❤️ Can you send them blessings?`,
        read: false,
        relatedPlayerId: senderId,
        createdAt: new Date().toISOString(),
      });

      return { success: true, message: `Life request sent to ${receiverName}!` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to request life.' };
    }
  },

  /**
   * Send a life to a friend who requested one
   */
  async sendLife(
    lifeRequestId: string,
    senderId: string,
    senderName: string,
    targetPlayerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Mark life request as sent if valid doc ID provided
      if (lifeRequestId && !lifeRequestId.startsWith('mock_')) {
        try {
          const reqRef = doc(db, 'life_requests', lifeRequestId);
          await updateDoc(reqRef, { status: 'sent' });
        } catch (e) {
          // May be a notification ID or already processed
        }
      }

      // Notify recipient so they can claim their life
      await addDoc(collection(db, 'notifications'), {
        recipientId: targetPlayerId,
        type: 'life_sent',
        message: `${senderName} sent you a life! ❤️ Claim it to keep playing!`,
        read: false,
        claimed: false,
        relatedPlayerId: senderId,
        createdAt: new Date().toISOString(),
      });

      return { success: true, message: `Life blessings sent to friend! ❤️` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to send life.' };
    }
  },

  /**
   * Fetch notifications for player
   */
  async getNotifications(userId: string): Promise<GameNotification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        limit(20)
      );
      const snap = await getDocs(q);
      const notifs: GameNotification[] = [];
      snap.forEach((d) => {
        notifs.push({ id: d.id, ...d.data() } as GameNotification);
      });
      // Sort newest first
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return notifs;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      const notifs = await this.getNotifications(userId);
      const unread = notifs.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  },
};
