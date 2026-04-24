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
    `w-full px-3.5 py-2.5 rounded-xl bg-background/80 border text-sm text-foreground placeholder:text-muted-foreground/60
     focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all
     ${errors[field] ? 'border-red-500/50' : 'border-border/50'}`;

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex items-stretch relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-accent/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] bg-primary/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Left: Spline Robot */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
        </div>
        <div
          ref={robotRef}
          className="relative w-full max-w-lg h-[500px]"
          style={{ willChange: 'transform' }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">Renew AI</span>
          </div>

          {/* Card */}
          <div className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Create your account</h1>
              <p className="text-sm text-muted-foreground mt-1">Start automating insurance renewals today</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input type="text" id="fullName" name="fullName" placeholder="John Doe"
                    className={inputClass('fullName')} value={formData.fullName} onChange={handleChange} disabled={loading} />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                  <input type="text" id="username" name="username" placeholder="johndoe"
                    className={inputClass('username')} value={formData.username} onChange={handleChange} disabled={loading} />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input type="email" id="email" name="email" placeholder="you@example.com"
                  className={inputClass('email')} value={formData.email} onChange={handleChange} disabled={loading} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="••••••••"
                    className={`${inputClass('password')} pr-10`}
                    value={formData.password} onChange={handleChange} disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-primary text-white font-semibold text-sm
                  hover:opacity-90 hover:shadow-glow active:scale-[0.98] transition-all disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
