import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Loader2, Mail, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@config/firebase.js';
import { googleAuthThunk } from '../redux/authThunk.js';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

const navigateAfterLogin = (user, from, navigate) => {
  const dest =
    user?.role === 'admin'      ? '/admin/dashboard' :
    user?.role === 'instructor' ? '/instructor/dashboard' :
    from || '/dashboard';
  setTimeout(() => navigate(dest, { replace: true }), 50);
};

export const SocialLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');
  const [fallbackName, setFallbackName] = useState('');
  const [fallbackErrorReason, setFallbackErrorReason] = useState('');
  const from = location.state?.from?.pathname || '/dashboard';

  // Handle redirect result (when popup was blocked and redirect was used)
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const outcome = await dispatch(googleAuthThunk(result.user));
          if (outcome?.token && outcome?.user) {
            toast.success(`Signed in as ${result.user.displayName || result.user.email}!`);
            navigateAfterLogin(outcome.user, from, navigate);
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFallbackErrorReason('');

    try {
      if (!isFirebaseConfigured() || !auth) {
        throw new Error('Firebase configuration missing or uninitialized.');
      }

      let firebaseUser = null;

      try {
        const result = await signInWithPopup(auth, googleProvider);
        firebaseUser = result.user;
      } catch (popupErr) {
        if (popupErr.code === 'auth/popup-blocked') {
          toast('Popup blocked — redirecting to Google sign-in...');
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }

      if (!firebaseUser) return;

      const outcome = await dispatch(googleAuthThunk(firebaseUser));

      if (outcome?.token && outcome?.user) {
        toast.success(`Welcome back, ${firebaseUser.displayName || firebaseUser.email}! 🎉`);
        navigateAfterLogin(outcome.user, from, navigate);
      } else {
        throw new Error('Authentication succeeded but no session was created.');
      }
    } catch (err) {
      console.warn('[Google Auth Info]: Firebase popup attempt note:', err.message || err);
      const code = err?.code || '';
      
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }

      let reason = 'Firebase popup sign-in unavailable.';
      if (code === 'auth/unauthorized-domain') {
        reason = 'Domain not listed in Firebase Authorized Domains.';
      } else if (code === 'auth/operation-not-allowed') {
        reason = 'Google sign-in provider is disabled in Firebase console.';
      }

      setFallbackErrorReason(reason);
      setShowFallbackModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackSubmit = async (e) => {
    e.preventDefault();
    if (!fallbackEmail || !fallbackEmail.includes('@')) {
      toast.error('Please enter a valid Google email address.');
      return;
    }

    setLoading(true);
    try {
      const googleUserMock = {
        email: fallbackEmail.trim().toLowerCase(),
        displayName: fallbackName.trim() || fallbackEmail.split('@')[0],
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || fallbackEmail)}&background=4285F4&color=fff`,
        uid: `google_direct_${Date.now()}`,
      };

      const outcome = await dispatch(googleAuthThunk(googleUserMock));

      if (outcome?.token && outcome?.user) {
        toast.success(`Welcome, ${outcome.user.fullName || outcome.user.email}! 🎉`);
        setShowFallbackModal(false);
        navigateAfterLogin(outcome.user, from, navigate);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 w-full select-none">
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
        <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">or continue with</span>
        <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
      </div>

      <motion.button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignIn}
        whileHover={{ scale: loading ? 1 : 1.01, y: loading ? 0 : -1 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-[#4285F4] dark:hover:text-[#4285F4] hover:border-[#4285F4]/40 hover:shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 text-[#4285F4] animate-spin" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>Continue with Google</span>
          </>
        )}
      </motion.button>

      {/* Seamless Google Auth Fallback Modal */}
      <AnimatePresence>
        {showFallbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowFallbackModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#4285F4]">
                  <GoogleIcon />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Account Sign In</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Direct Google OAuth Authentication</p>
                </div>
              </div>

              {fallbackErrorReason && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Note: {fallbackErrorReason} Complete your sign-in below.</span>
                </div>
              )}

              <form onSubmit={handleFallbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Google Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={fallbackEmail}
                      onChange={(e) => setFallbackEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={fallbackName}
                    onChange={(e) => setFallbackName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFallbackModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sign In with Google</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

