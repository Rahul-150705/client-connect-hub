import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { showToast } from '../lib/toast';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getGoogleAuthUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${backendOrigin}/oauth2/authorization/google`;
};

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('token') || hashParams.get('token');
    const agentId = Number(params.get('agentId') || hashParams.get('agentId'));
    const username = params.get('username') || hashParams.get('username');
    const fullName = params.get('fullName') || hashParams.get('fullName');
    const email = params.get('email') || hashParams.get('email');

    if (!token || !username || !email) {
      return;
    }

    login(token, {
      agentId: Number.isFinite(agentId) ? agentId : 0,
      username,
      fullName: fullName || username,
      email,
    });

    showToast.success('Welcome', `Logged in with Google as ${fullName || username}`);
    window.history.replaceState({}, '', '/login');
    navigate('/');
  }, [login, navigate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!credentials.username) e.username = 'Required';
    if (!credentials.password) e.password = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.login(credentials);
      const { token, agentId, username, fullName, email } = res.data;
      login(token, { agentId, username, fullName, email });
      const displayTitle = fullName ? fullName.toUpperCase() : username.toUpperCase();
      showToast.success('Welcome', `Glad to have you back, ${displayTitle}`);
      navigate('/');
    } catch (err: any) {
      showToast.error('Login Failed', err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen bg-[#09080A] flex" style={{ fontFamily: 'Syne, sans-serif' }}>
      {/* Left panel — typographic brand wall */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 bg-[#0a0908] border-r border-[#1e1c1f] overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#F5F0E8 1px, transparent 1px), linear-gradient(90deg, #F5F0E8 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />

        {/* Amber accent circle */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-24 right-0 w-px h-64 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent" />

        {/* Top brand */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
              <span className="text-black font-black text-sm" style={{ fontFamily: 'DM Mono, monospace' }}>R</span>
            </div>
            <span className="text-[#F5F0E8] font-bold text-sm tracking-[0.15em] uppercase">Renew AI</span>
          </div>

          {/* Big editorial typography */}
          <h1 className="text-[72px] leading-[0.9] font-black tracking-tight text-[#F5F0E8] mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Insure.<br />
            <span className="text-amber-500 italic">Renew.</span><br />
            Grow.
          </h1>
          <p className="text-[#F5F0E8]/50 text-sm leading-relaxed max-w-xs">
            The insurance management platform built for brokers who move fast.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-7 h-7 bg-amber-500 flex items-center justify-center">
              <span className="text-black font-black text-xs">R</span>
            </div>
            <span className="font-bold text-sm tracking-[0.15em] uppercase">Renew AI</span>
          </div>

          <div className="mb-10">
            <p className="text-[10px] text-amber-500 uppercase tracking-[0.25em] mb-3" style={{ fontFamily: 'DM Mono, monospace' }}>
              Agent Access
            </p>
            <h2 className="text-3xl font-black text-[#F5F0E8] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              Sign in to<br />your workspace
            </h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#F5F0E8]/50 mb-2"
                style={{ fontFamily: 'DM Mono, monospace' }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="agent_handle"
                value={credentials.username}
                onChange={handleChange}
                disabled={loading}
                className={`w-full bg-[#0d0c0e] border px-4 py-3.5 text-sm text-[#F5F0E8] placeholder:text-[#F5F0E8]/20
                  focus:outline-none focus:border-amber-500 transition-colors
                  ${errors.username ? 'border-red-500/60' : 'border-[#1e1c1f] hover:border-[#2e2c30]'}`}
                style={{ fontFamily: 'DM Mono, monospace', borderRadius: 0 }}
              />
              {errors.username && (
                <p className="text-red-400 text-[10px] mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#F5F0E8]/50 mb-2"
                style={{ fontFamily: 'DM Mono, monospace' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full bg-[#0d0c0e] border px-4 py-3.5 pr-12 text-sm text-[#F5F0E8] placeholder:text-[#F5F0E8]/20
                    focus:outline-none focus:border-amber-500 transition-colors
                    ${errors.password ? 'border-red-500/60' : 'border-[#1e1c1f] hover:border-[#2e2c30]'}`}
                  style={{ fontFamily: 'DM Mono, monospace', borderRadius: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F0E8]/30 hover:text-[#F5F0E8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-[10px] mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-black
                py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-60 group"
              style={{ borderRadius: 0 }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1e1c1f]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.25em] text-[#F5F0E8]/35"
                style={{ fontFamily: 'DM Mono, monospace' }}>
                <span className="bg-[#09080A] px-3">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-[#1e1c1f] bg-[#ffffff] hover:border-[#4285F4] text-[#1f1f1f]
                py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-60"
              style={{ borderRadius: 0 }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C16.8 3.2 14.7 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c6.9 0 11.4-4.8 11.4-11.6 0-.8-.1-1.4-.2-2H12z" opacity="0.9"/>
                <path fill="#34A853" d="M3.8 7.2l3.8 2.8c1-1.8 3.1-3 5.4-3 1.9 0 3.2.8 4 1.5l2.7-2.6C16.8 3.2 14.7 2.2 12 2.2c-3.7 0-6.9 2.1-8.2 5z" opacity="0.9"/>
                <path fill="#FBBC05" d="M3.8 15.6c1.3 2.9 4.5 5 8.2 5 2.5 0 4.6-.9 6.1-2.5l-3-2.5c-.8.5-1.9.9-3.1.9-2.2 0-4.2-1.5-4.9-3.5l-3.3 2.6z" opacity="0.9"/>
                <path fill="#4285F4" d="M12 21.1c2.7 0 5-.9 6.7-2.4l-3-2.5c-.9.6-2.1 1-3.7 1-2.9 0-5.4-2-6.2-4.7l-3.3 2.6C1.6 18.3 6.1 21.1 12 21.1z" opacity="0.9"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Demo creds */}
          <div className="mt-6 border border-[#1e1c1f] p-4 bg-[#0d0c0e]" style={{ borderRadius: 0 }}>
            <p className="text-[9px] text-[#F5F0E8]/30 uppercase tracking-[0.2em] mb-2" style={{ fontFamily: 'DM Mono, monospace' }}>
              Demo credentials
            </p>
            <p className="text-sm text-amber-500 font-bold" style={{ fontFamily: 'DM Mono, monospace' }}>
              rahul1 / rahul1818
            </p>
          </div>

          <p className="mt-6 text-xs text-[#F5F0E8]/40 text-center">
            No account?{' '}
            <Link to="/signup" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;