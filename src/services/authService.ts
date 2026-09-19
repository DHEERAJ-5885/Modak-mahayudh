import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { playerService } from './playerService';
import { storageService } from './storageService';
import { PlayerProfile } from '../types';

export const authService = {
  /**
   * Register a new player account with authentic Firebase Auth
   */
  async registerPlayer(
    displayName: string,
    email: string,
    password: string
  ): Promise<PlayerProfile> {
    const cleanName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter a player name with at least 2 characters.');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // 1. Create Firebase Auth user first (authenticated immediately upon creation)
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCred.user;

    // 2. Update Auth user profile with display name
    try {
      await updateProfile(user, { displayName: cleanName });
    } catch (e) {
      console.warn('Could not update Firebase Auth profile display name:', e);
    }

    // 3. Create fresh player record in Firestore for this authenticated user
    const newProfile = await playerService.createPlayerProfile(
      user.uid,
      cleanName,
      cleanEmail
    );

    return newProfile;
  },

  /**
   * Log into existing account by Email and Password
   */
  async loginPlayer(emailInput: string, password: string): Promise<PlayerProfile> {
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Please enter your registered email address.');
    }
    if (!cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address (e.g. warrior@temple.com).');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    // Authenticate with Firebase Auth (passwords handled strictly by Firebase Auth)
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCred.user;

    // Load full player profile from Firestore
    let profile = await playerService.getPlayerProfile(user.uid);

    // If profile was missing in database, initialize clean profile
    if (!profile) {
      profile = await playerService.createPlayerProfile(
        user.uid,
        user.displayName || 'Temple Warrior',
        user.email || cleanEmail
      );
    }

    return profile;
  },

  /**
   * 1-Click Authentication using Google Sign-In (Firebase Auth popup)
   */
  async loginWithGoogle(): Promise<PlayerProfile> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCred = await signInWithPopup(auth, provider);
    const user = userCred.user;

    const displayName = user.displayName || 'Temple Warrior';
    const email = user.email || '';

    // Check if player profile already exists in Firestore
    let profile = await playerService.getPlayerProfile(user.uid);
    if (!profile) {
      profile = await playerService.createPlayerProfile(
        user.uid,
        displayName,
        email
      );
    }
    return profile;
  },

  /**
   * Log out of the current session & clear local caches
   */
  async logout(): Promise<void> {
    storageService.clearProgress();
    await signOut(auth);
  },

  /**
   * Send Firebase Password Reset Email
   */
  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address for password reset.');
    }
    await sendPasswordResetEmail(auth, cleanEmail);
  },

  /**
   * Listen to Firebase Auth state transitions
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get currently authenticated user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};
