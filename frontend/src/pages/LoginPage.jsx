import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Library, Lock, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const LoginPage = () => {
  const { login, isAuthenticated, isLibrarian } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  // Password reset flow
  const [mode, setMode]           = useState('login'); // login | forgot | otp | reset
  const [otp, setOtp]             = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const orb3Ref = useRef(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isLibrarian ? '/lib/dashboard' : '/student/home', { replace: true });
    }
  }, [isAuthenticated, isLibrarian, navigate]);

  // Animated background orbs
  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(orb1Ref.current, { x: 60, y: -40, duration: 8, ease: 'sine.inOut' })
      .to(orb2Ref.current, { x: -50, y: 60, duration: 10, ease: 'sine.inOut' }, 0)
      .to(orb3Ref.current, { x: 30, y: 30, duration: 12, ease: 'sine.inOut' }, 0);
    return () => tl.kill();
  }, []);

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 50%, #13132d 0%, #0a0a1a 100%)' }}>

      {/* Animated orbs */}
      <div ref={orb1Ref} className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div ref={orb2Ref} className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }} />
      <div ref={orb3Ref} className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.2)', '0 0 40px rgba(99,102,241,0.5)', '0 0 20px rgba(99,102,241,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Library size={28} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold font-display text-gradient">Booksphere</h1>
          <p className="text-slate-400 text-sm mt-1">Library Management System</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">
            {mode === 'login'   ? 'Sign In'          :
             mode === 'forgot'  ? 'Reset Password'   :
             mode === 'otp'     ? 'Enter OTP'        :
                                  'Set New Password'}
          </h2>

          {/* Error */}
          {error && (
            <motion.div
              className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm text-danger-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={email} onChange={e => setEmail(e.target.value)}
                    type="email" required placeholder="you@university.edu"
                    className="input pl-9" autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={password} onChange={e => setPassword(e.target.value)}
                    type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                    className="input pl-9 pr-10" autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => { setMode('forgot'); setError(''); }}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Forgot password?
              </button>
              <motion.button
                type="submit" disabled={isLoading}
                className="btn-primary btn w-full justify-center"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {isLoading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Sign In'}
              </motion.button>
            </form>
          )}

          {/* Forgot password */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" required placeholder="you@university.edu" className="input" />
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary btn w-full justify-center">
                {isLoading ? '...' : 'Send OTP'}
              </button>
              <button type="button" onClick={() => setMode('login')}
                className="btn-ghost btn w-full justify-center text-xs">Back to Login</button>
            </form>
          )}

          {/* OTP */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-slate-400">Enter the 6-digit OTP sent to {email}</p>
              <input value={otp} onChange={e => setOtp(e.target.value)}
                type="text" required maxLength={6} placeholder="123456" className="input text-center text-xl tracking-widest" />
              <button type="submit" disabled={isLoading} className="btn-primary btn w-full justify-center">
                {isLoading ? '...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* New password */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                type="password" required minLength={8} placeholder="New password (min 8 chars)" className="input" />
              <button type="submit" disabled={isLoading} className="btn-primary btn w-full justify-center">
                {isLoading ? '...' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Booksphere LMS v1.0 · Built for your university library
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
