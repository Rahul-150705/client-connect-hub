import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { SplineScene } from '../components/SplineScene';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Cursor-follow refs
  const containerRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      const lerp = 0.06;
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * lerp;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * lerp;
      if (robotRef.current) {
        const rY = currentPos.current.x * 12;
        const rX = -currentPos.current.y * 8;
        const tX = currentPos.current.x * 15;
        const tY = currentPos.current.y * 10;
        robotRef.current.style.transform = `perspective(800px) rotateY(${rY}deg) rotateX(${rX}deg) translate(${tX}px, ${tY}px)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleMouseMove]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required.';
    if (!formData.username) newErrors.username = 'Username is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email.';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-0 focus:outline-none transition-colors ${errors[field] ? 'border-rose-500/50' : 'border-white/10'}`;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] flex items-stretch relative overflow-hidden">
      {/* Left: Spline */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0d0d14] items-center justify-center overflow-hidden">
        <div className="absolute top-[-120px] right-[-120px] w-[420px] h-[420px] bg-violet-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-120px] left-[-120px] w-[420px] h-[420px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div
          ref={robotRef}
          className="relative w-full max-w-lg h-[520px]"
          style={{ willChange: 'transform' }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
        <div className="absolute bottom-10 left-0 right-0 px-12 flex flex-col items-center gap-5">
          <div className="flex flex-wrap gap-2 justify-center">
            {['AI-Powered', 'WhatsApp Ready', 'Real-time Analytics'].map((t) => (
              <span key={t} className="flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 text-xs text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Renew AI</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-white/50 mt-1 mb-8">Start automating renewals today</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-wider">Full name</label>
                <input type="text" id="fullName" name="fullName" placeholder="John Doe"
                  className={inputClass('fullName')} value={formData.fullName} onChange={handleChange} disabled={loading} />
                {errors.fullName && <p className="text-rose-400 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-wider">Username</label>
                <input type="text" id="username" name="username" placeholder="johndoe"
                  className={inputClass('username')} value={formData.username} onChange={handleChange} disabled={loading} />
                {errors.username && <p className="text-rose-400 text-xs mt-1">{errors.username}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-wider">Email</label>
              <input type="email" id="email" name="email" placeholder="you@example.com"
                className={inputClass('email')} value={formData.email} onChange={handleChange} disabled={loading} />
              {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/70 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="••••••••"
                  className={`${inputClass('password')} pr-11`}
                  value={formData.password} onChange={handleChange} disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold text-sm transition-all disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-medium hover:text-indigo-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
