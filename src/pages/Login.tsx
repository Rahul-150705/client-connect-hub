import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { showToast } from '../lib/toast';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuth();

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