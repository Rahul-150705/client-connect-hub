import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { showToast } from '../lib/toast';
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../services/api';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName) e.fullName = 'Required';
    if (!formData.username) e.username = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
    if (formData.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authAPI.signup(formData);
      showToast.success('Success', 'Account created. Please sign in.');
      navigate('/login');
    } catch (err: any) {
      showToast.error('Signup Failed', err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    'Automated WhatsApp renewal reminders',
    'Real-time portfolio analytics',
    'AI-powered insights & forecasting',
    'Multi-channel delivery tracking',
  ];

  const Field = ({ name, label, type = 'text', placeholder }: { name: string; label: string; type?: string; placeholder: string }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#F5F0E8]/40 mb-2"
        style={{ fontFamily: 'DM Mono, monospace' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          name={name}
          placeholder={placeholder}
          value={(formData as any)[name]}
          onChange={handleChange}
          disabled={loading}
          className={`w-full bg-[#0d0c0e] border px-4 py-3 text-sm text-[#F5F0E8] placeholder:text-[#F5F0E8]/15
            focus:outline-none focus:border-amber-500 transition-colors
            ${errors[name] ? 'border-red-500/50' : 'border-[#1e1c1f] hover:border-[#2a2830]'}`}
          style={{ fontFamily: 'DM Mono, monospace', borderRadius: 0 }}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F0E8]/30 hover:text-[#F5F0E8] transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {errors[name] && (
        <p className="text-red-400 text-[10px] mt-1" style={{ fontFamily: 'DM Mono, monospace' }}>{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09080A] flex" style={{ fontFamily: 'Syne, sans-serif' }}>
      {/* Right side: perks panel (flipped vs login) */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between p-12 bg-[#09080A] border-r border-[#1e1c1f] order-2 relative overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#F5F0E8 1px, transparent 1px), linear-gradient(90deg, #F5F0E8 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />

        <div className="relative">
          <p className="text-[9px] text-amber-500 uppercase tracking-[0.3em] mb-8" style={{ fontFamily: 'DM Mono, monospace' }}>
            What you get
          </p>
          <h3 className="text-4xl font-black text-[#F5F0E8] leading-tight mb-12"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Built for the<br />
            <span className="text-amber-500 italic">modern broker.</span>
          </h3>
          <ul className="space-y-5">
            {perks.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-sm text-[#F5F0E8]/70 leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="h-px bg-[#1e1c1f] mb-6" />
          <p className="text-xs text-[#F5F0E8]/30 leading-relaxed">
            Join 500+ brokers automating their renewal workflow with Renew AI.
          </p>
        </div>
      </div>

      {/* Left side: form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14 order-1">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-7 h-7 bg-amber-500 flex items-center justify-center">
              <span className="text-black font-black text-xs">R</span>
            </div>
            <span className="font-bold text-sm tracking-[0.15em] uppercase text-[#F5F0E8]">Renew AI</span>
          </div>

          <div className="mb-8">
            <p className="text-[10px] text-amber-500 uppercase tracking-[0.25em] mb-3" style={{ fontFamily: 'DM Mono, monospace' }}>
              New Account
            </p>
            <h2 className="text-3xl font-black text-[#F5F0E8] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              Create your<br />agent profile
            </h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field name="fullName" label="Full Name" placeholder="Jane Doe" />
              <Field name="username" label="Username" placeholder="jane_doe" />
            </div>
            <Field name="email" label="Email Address" type="email" placeholder="you@example.com" />
            <Field name="password" label="Password" type="password" placeholder="••••••••" />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-black
                py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-60 group mt-2"
              style={{ borderRadius: 0 }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-[#F5F0E8]/40 text-center">
            Already have access?{' '}
            <Link to="/login" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;