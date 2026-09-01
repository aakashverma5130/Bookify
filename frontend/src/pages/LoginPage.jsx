import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sun, Moon } from 'lucide-react';
import logoSrc from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { authApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const LoginPage = () => {
  const { login, isAuthenticated, isLibrarian } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  // Password reset flow — all 4 modes preserved exactly
  const [mode, setMode]           = useState('login'); // login | forgot | otp | reset
  const [otp, setOtp]             = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const orbRef = useRef(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isLibrarian ? '/lib/dashboard' : '/student/home', { replace: true });
    }
  }, [isAuthenticated, isLibrarian, navigate]);

  // Subtle background animation
  useEffect(() => {
    if (!orbRef.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(orbRef.current, { x: 40, y: -30, duration: 10, ease: 'sine.inOut' });
    return () => tl.kill();
  }, []);

  // Auth handlers — all logic preserved
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(data.user.role === 'STUDENT' ? '/student/home' : '/lib/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email first'); return; }
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success('OTP sent! Check your email.');
      setMode('otp');
      setError('');
    } catch {
      setError('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ email, otp });
      setResetToken(data.resetToken);
      setMode('reset');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      await authApi.resetPassword({ password: newPassword }, resetToken);
      toast.success('Password reset! Please log in.');
      setMode('login');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const modeTitle = {
    login:  'Welcome back.',
    forgot: 'Reset your password.',
    otp:    'Check your email.',
    reset:  'Create new password.',
  };
  const modeSubtitle = {
    login:  'Sign in to continue to your library account.',
    forgot: 'Enter your email to receive a one-time password.',
    otp:    `We sent a 6-digit code to ${email}`,
    reset:  'Choose a strong password for your account.',
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col justify-center"
      style={{ background: isDark ? '#0b1326' : 'var(--color-background)' }}
    >
      {/* Subtle background orb */}
      <div
        ref={orbRef}
        className="absolute pointer-events-none"
        style={{
          top: '-10%', right: '-5%',
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(26,43,75,0.8) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(3,22,53,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-6 right-6 p-2.5 rounded-lg transition-colors z-20"
        style={{ color: 'var(--color-on-surface-variant)', background: 'var(--color-surface-container-low)' }}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12 md:px-0">

        {/* Brand */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
        >
          <div className="flex items-center gap-3 mb-8">
            <img
              src={logoSrc}
              alt="Bookify"
              className="w-9 h-9 object-contain rounded-full"
            />
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: 'var(--color-primary)' }}
            >
              Bookify
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <h1
                className="text-4xl font-bold tracking-tight mb-3"
                style={{ color: 'var(--color-on-background)', letterSpacing: '-0.02em', lineHeight: '1.1' }}
              >
                {modeTitle[mode]}
              </h1>
              <p className="text-base" style={{ color: 'var(--color-on-surface-variant)' }}>
                {modeSubtitle[mode]}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Form card */}
        <motion.div
          className="rounded-xl p-8 md:p-10"
          style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 4px 20px rgba(26,43,75,0.06)',
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0, 0, 0.2, 1] }}
        >
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
                style={{ background: 'var(--color-danger-container)', color: 'var(--color-danger)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Login form ─────────────────────────────────────────── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-on-surface)' }}
                  htmlFor="login-email"
                >
                  Email / Student ID
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-on-surface-muted)' }} />
                  <input
                    id="login-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="student@university.edu"
                    className="input pl-10 h-12"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-on-surface)' }}
                  htmlFor="login-password"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-on-surface-muted)' }} />
                  <input
                    id="login-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="input pl-10 pr-11 h-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-on-surface-muted)' }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="pt-2 space-y-3">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 flex justify-center items-center rounded-lg text-sm font-semibold transition-opacity"
                  style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}
                  whileHover={{ opacity: 0.92 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : 'Sign In'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); }}
                  className="w-full h-12 flex justify-center items-center rounded-lg text-sm font-semibold transition-colors"
                  style={{ color: 'var(--color-primary)', background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary-container)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-primary)'; }}
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {/* ── Forgot password ────────────────────────────────────── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-on-surface)' }} htmlFor="forgot-email">
                  Email
                </label>
                <input
                  id="forgot-email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="student@university.edu"
                  className="input h-12"
                />
              </div>
              <div className="pt-2 space-y-3">
                <button type="submit" disabled={isLoading} className="w-full h-12 flex justify-center items-center rounded-lg text-sm font-semibold" style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
                  {isLoading ? '...' : 'Send OTP'}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="btn-ghost btn w-full justify-center text-sm">
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* ── OTP verification ───────────────────────────────────── */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-on-surface)' }} htmlFor="otp-input">
                  One-Time Password
                </label>
                <input
                  id="otp-input"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="input h-12 text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full h-12 flex justify-center items-center rounded-lg text-sm font-semibold" style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
                {isLoading ? '...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* ── New password ───────────────────────────────────────── */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-on-surface)' }} htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-on-surface-muted)' }} />
                  <input
                    id="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="input pl-10 h-12"
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full h-12 flex justify-center items-center rounded-lg text-sm font-semibold" style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
                {isLoading ? '...' : 'Set New Password'}
              </button>
            </form>
          )}
        </motion.div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-on-surface-muted)' }}>
          Bookify LMS · Built for your university library
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
