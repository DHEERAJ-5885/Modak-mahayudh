import React, { useState } from 'react';
import { ASSETS } from '../data/gameData';
import { authService } from '../services/authService';
import { PlayerProfile } from '../types';
import { playSound } from '../utils/sound';
import { AppIcon } from './AppIcon';

interface AuthScreenProps {
  onAuthSuccess: (player: PlayerProfile) => void;
  soundEnabled?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  soundEnabled = true,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const clearErrors = () => setFieldErrors({});

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const errors: typeof fieldErrors = {};
    const trimmedEmail = loginIdentifier.trim().toLowerCase();

    if (!trimmedEmail) {
      errors.identifier = 'Please enter your registered email address.';
    } else if (!trimmedEmail.includes('@')) {
      errors.identifier = 'Please enter a valid email address (e.g. warrior@temple.com).';
    }
    if (!password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      playSound('defeat', soundEnabled);
      return;
    }

    setIsLoading(true);
    try {
      playSound('click', soundEnabled);
      const player = await authService.loginPlayer(trimmedEmail, password);
      playSound('victory', soundEnabled);
      onAuthSuccess(player);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setFieldErrors({ general: 'Incorrect email or password. Please verify your credentials.' });
      } else if (msg.includes('operation-not-allowed')) {
        setFieldErrors({
          general: 'Email/Password sign-in provider is disabled in Firebase Console (Authentication > Sign-in method). Please enable Email/Password in your Firebase Console, or use "Continue with Google / Gmail" above to sign in immediately with your Gmail!',
        });
      } else {
        setFieldErrors({ general: msg || 'Login failed. Please try again.' });
      }
      playSound('defeat', soundEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google 1-Click Sign-In
  const handleGoogleAuth = async () => {
    clearErrors();
    setIsLoading(true);
    try {
      playSound('click', soundEnabled);
      const player = await authService.loginWithGoogle();
      playSound('victory', soundEnabled);
      onAuthSuccess(player);
    } catch (err: any) {
      const msg = err.message || '';
      if (!msg.includes('popup-closed-by-user')) {
        setFieldErrors({ general: 'Google sign-in could not be completed: ' + msg });
      }
      playSound('defeat', soundEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Account Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const errors: typeof fieldErrors = {};
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.displayName = 'Please enter a player name.';
    } else if (trimmedName.length < 2 || trimmedName.length > 25) {
      errors.displayName = 'Player name must be between 2 and 25 characters.';
    }

    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email format (e.g. warrior@temple.com).';
    }

    if (!password) {
      errors.password = 'Please create a password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match. Please re-enter.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      playSound('defeat', soundEnabled);
      return;
    }

    setIsLoading(true);
    try {
      playSound('click', soundEnabled);
      const player = await authService.registerPlayer(trimmedName, trimmedEmail, password);
      playSound('victory', soundEnabled);
      onAuthSuccess(player);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('email-already-in-use')) {
        setFieldErrors({ email: 'This email is already registered. Please log in.' });
      } else if (msg.includes('operation-not-allowed')) {
        setFieldErrors({
          general: 'Email/Password sign-in provider is disabled in Firebase Console (Authentication > Sign-in method). Please enable Email/Password in your Firebase Console, or use "Register with Google / Gmail" above to create your player account instantly!',
        });
      } else {
        setFieldErrors({ general: msg || 'Account creation failed. Please try again.' });
      }
      playSound('defeat', soundEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setResetSuccessMessage('');

    if (!email.trim()) {
      setFieldErrors({ email: 'Please enter your registered email address.' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email);
      setResetSuccessMessage('Password reset link sent to your email! Please check your inbox.');
      playSound('victory', soundEnabled);
    } catch (err: any) {
      setFieldErrors({ email: err.message || 'Failed to send reset link.' });
      playSound('defeat', soundEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full bg-[#140120] text-[#fff9ef] flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 select-none relative overflow-x-hidden overflow-y-auto font-body pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_25%,#46175f_0%,#1a022b_60%,#0e0017_100%)] z-0" />

      <div className="relative z-10 w-full max-w-[420px] bg-[#1c012d] border border-[#ff6f00]/30 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-1rem-env(safe-area-inset-bottom,0px)-env(safe-area-inset-top,0px))] sm:max-h-[calc(100dvh-2rem)]">
        {/* TOP HERO HEADER */}
        <div className="relative shrink-0 bg-gradient-to-b from-[#2b0e3b] via-[#3a1d4a] to-[#1c012d] pt-4 sm:pt-6 pb-3 sm:pb-4 px-4 sm:px-6 flex flex-col items-center text-center border-b border-[#ff6f00]/25">
          {/* Logo with Golden Halo */}
          <div className="relative mb-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#462856] border-2 border-[#ffdb3c]/40 flex items-center justify-center shadow-[0_0_30px_rgba(255,219,60,0.4)]">
              <img
                src={ASSETS.logo}
                alt="Lord Ganesha"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-[0_2px_8px_rgba(255,219,60,0.6)]"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-[#ff6f00] text-white text-[10px] px-1.5 py-0.5 rounded-full shadow border border-[#ffe16d]/50">
              🐘
            </span>
          </div>

          <span className="font-body text-[10px] sm:text-[11px] text-[#ffb691] font-bold uppercase tracking-widest">
            Ganesh Vighna Vijay
          </span>
          <h1 className="font-display text-[18px] sm:text-[22px] font-black text-[#ffdb3c] tracking-tight leading-tight drop-shadow">
            MODAK MAHAYUDH
          </h1>
          <p className="font-body text-[12px] sm:text-[13px] text-[#e1bfb0] mt-0.5">
            {mode === 'login'
              ? 'Welcome, Player! Enter the sacred pandal.'
              : mode === 'register'
              ? 'Create your temple warrior identity.'
              : 'Recover your player access.'}
          </p>
        </div>

        {/* MODE SWITCHER TABS (Login vs Register) */}
        {mode !== 'forgot' && (
          <div className="shrink-0 flex border-b border-[#3a1d4a] bg-[#140120]/60 p-1">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setMode('login');
                clearErrors();
              }}
              className={`flex-1 py-2.5 text-center font-display text-[12px] sm:text-[13px] font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#ff6f00] text-white shadow-md'
                  : 'text-[#ffb691] hover:text-white'
              }`}
            >
              PLAY NOW
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setMode('register');
                clearErrors();
              }}
              className={`flex-1 py-2.5 text-center font-display text-[12px] sm:text-[13px] font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#ff6f00] text-white shadow-md'
                  : 'text-[#ffb691] hover:text-white'
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>
        )}

        {/* FORM CONTAINER */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col gap-4 overscroll-contain auth-scroll">
          {/* General Alert */}
          {fieldErrors.general && (
            <div className="bg-[#521327] border border-[#ff6689]/70 text-[#ffd9de] p-3 rounded-xl text-[12px] flex items-start gap-2.5 shadow-md shrink-0">
              <AppIcon name="warning" size={18} className="text-[#ff6689] shrink-0 mt-0.5" />
              <span className="leading-snug flex-1">{fieldErrors.general}</span>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="bg-[#123821] border border-emerald-500/60 text-emerald-200 px-3 py-2 rounded-xl text-[12px] flex items-center gap-2">
              <AppIcon name="check_circle" size={16} className="text-emerald-400 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <div className="flex flex-col gap-3.5">
              {/* 1-Click Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-bold text-[13px] rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-gray-200 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google / Gmail</span>
              </button>

              <div className="flex items-center my-0.5">
                <div className="flex-1 h-px bg-white/15" />
                <span className="px-3 text-[10px] uppercase tracking-wider text-[#ffb691]/70 font-semibold">
                  or email & password
                </span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                {/* Registered Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] sm:text-[12px] font-bold text-[#ffb691] flex items-center gap-1.5">
                    <AppIcon name="email" size={14} className="text-[#ffdb3c]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. warrior@temple.com"
                    className="bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-400 outline-none transition-colors shadow-inner"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  {fieldErrors.identifier && (
                    <span className="text-[11px] text-[#ff6689] font-semibold mt-0.5">
                      {fieldErrors.identifier}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] sm:text-[12px] font-bold text-[#ffb691] flex items-center gap-1.5">
                      <AppIcon name="lock" size={14} className="text-[#ffdb3c]" />
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setMode('forgot');
                        clearErrors();
                      }}
                      className="text-[11px] text-[#ffdb3c] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-400 outline-none transition-colors shadow-inner"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  {fieldErrors.password && (
                    <span className="text-[11px] text-[#ff6689] font-semibold mt-0.5">
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full py-3 bg-gradient-to-r from-[#ff6f00] via-[#ffdb3c] to-[#ffe16d] text-[#3a1d4a] font-display text-[14px] sm:text-[15px] font-black rounded-xl shadow-[0_6px_20px_rgba(255,111,0,0.5)] active:scale-98 transition-all hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#3a1d4a] border-t-transparent animate-spin" />
                      <span>ENTERING PANDAL... 🪔</span>
                    </>
                  ) : (
                    <>
                      <AppIcon name="play_arrow" size={20} className="text-[#3a1d4a]" />
                      <span>PLAY NOW</span>
                    </>
                  )}
                </button>

                {/* Switch to Register */}
                <div className="text-center pt-2 pb-1">
                  <span className="text-[12px] text-[#e1bfb0]">New player? </span>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setMode('register');
                      clearErrors();
                    }}
                    className="text-[12px] font-extrabold text-[#ffdb3c] hover:underline cursor-pointer"
                  >
                    CREATE ACCOUNT
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. REGISTER MODE */}
          {mode === 'register' && (
            <div className="flex flex-col gap-3">
              {/* 1-Click Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-bold text-[13px] rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-gray-200 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Register with Google / Gmail</span>
              </button>

              <div className="flex items-center my-0.5">
                <div className="flex-1 h-px bg-white/15" />
                <span className="px-3 text-[10px] uppercase tracking-wider text-[#ffb691]/70 font-semibold">
                  or with email
                </span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-3">
              {/* Player Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] sm:text-[12px] font-bold text-[#ffb691] flex items-center gap-1.5">
                  <AppIcon name="badge" size={14} className="text-[#ffdb3c]" />
                  Player Name (Public In-Game Identity)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aarav, Pooja, or Vikram"
                  maxLength={25}
                  className="bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-400 outline-none transition-colors shadow-inner"
                  disabled={isLoading}
                />
                {fieldErrors.displayName && (
                  <span className="text-[11px] text-[#ff6689] font-semibold mt-0.5">
                    {fieldErrors.displayName}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] sm:text-[12px] font-bold text-[#ffb691] flex items-center gap-1.5">
                  <AppIcon name="email" size={14} className="text-[#ffdb3c]" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="warrior@temple.com"
                  className="bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-400 outline-none transition-colors shadow-inner"
                  autoComplete="email"
                  disabled={isLoading}
                />
                {fieldErrors.email && (
                  <span className="text-[11px] text-[#ff6689] font-semibold mt-0.5">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] sm:text-[12px] font-bold text-[#ffb691] flex items-center gap-1.5">
                  <AppIcon name="lock" size={14} className="text-[#ffdb3c]" />
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-400 outline-none transition-colors shadow-inner"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                {fieldErrors.password && (
                  <span className="text-[11px] text-[#ff6689] font-semibold mt-0.5">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] sm:text-[12px] font-bold text-[#ffb691] flex items-center gap-1.5">
                  <AppIcon name="check" size={14} className="text-[#ffdb3c]" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-400 outline-none transition-colors shadow-inner"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                {fieldErrors.confirmPassword && (
                  <span className="text-[11px] text-[#ff6689] font-semibold mt-0.5">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-3 bg-gradient-to-r from-[#ff6f00] via-[#ffdb3c] to-[#ffe16d] text-[#3a1d4a] font-display text-[14px] sm:text-[15px] font-black rounded-xl shadow-[0_6px_20px_rgba(255,111,0,0.5)] active:scale-98 transition-all hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#3a1d4a] border-t-transparent animate-spin" />
                    <span>REGISTERING PLAYER... 🕉️</span>
                  </>
                ) : (
                  <>
                    <AppIcon name="how_to_reg" size={20} className="text-[#3a1d4a]" />
                    <span>CREATE ACCOUNT</span>
                  </>
                )}
              </button>

              {/* Switch to Login */}
              <div className="text-center pt-2 pb-1">
                <span className="text-[12px] text-[#e1bfb0]">Already have a player? </span>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setMode('login');
                    clearErrors();
                  }}
                  className="text-[12px] font-extrabold text-[#ffdb3c] hover:underline cursor-pointer"
                >
                  PLAY NOW
                </button>
              </div>
            </form>
          </div>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setMode('login');
                    clearErrors();
                  }}
                  className="p-1 rounded-lg bg-[#3a1d4a] hover:bg-[#462856] text-[#ffdb3c] cursor-pointer"
                >
                  <AppIcon name="arrow_back" size={16} />
                </button>
                <h3 className="font-display text-[14px] text-[#ffdb3c] font-bold">
                  Reset Player Password
                </h3>
              </div>

              <p className="text-[12px] text-[#e1bfb0]">
                Enter your registered email address to receive a secure password reset link.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] sm:text-[12px] font-bold text-[#ffb691] flex items-center gap-1.5">
                  <AppIcon name="email" size={14} className="text-[#ffdb3c]" />
                  Registered Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="warrior@temple.com"
                  className="bg-[#2b0e3b] border border-[#ff6f00]/30 focus:border-[#ffdb3c] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-400 outline-none transition-colors shadow-inner"
                  disabled={isLoading}
                />
                {fieldErrors.email && (
                  <span className="text-[11px] text-[#ff6689] font-semibold mt-0.5">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 w-full py-2.5 bg-[#ff6f00] hover:bg-[#ff8017] text-white font-display text-[13px] font-bold rounded-xl shadow active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? 'SENDING RESET LINK...' : 'SEND RESET LINK'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setMode('login');
                    clearErrors();
                  }}
                  className="text-[12px] text-[#ffb691] hover:text-[#ffdb3c] cursor-pointer"
                >
                  Return to Play Now
                </button>
              </div>
            </form>
          )}
        </div>

        {/* FOOTER BLESSING */}
        <div className="shrink-0 p-2.5 sm:p-3 bg-[#140120]/80 border-t border-[#3a1d4a] text-center">
          <span className="font-body text-[10px] text-[#ffb691]/80">
            Powered by Firebase Cloud Firestore & Auth • Data Persists Across Devices
          </span>
        </div>
      </div>
    </div>
  );
};
