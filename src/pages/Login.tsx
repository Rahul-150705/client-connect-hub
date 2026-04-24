import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SplineScene } from '../components/SplineScene';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuth();

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
    if (!credentials.username) newErrors.username = 'Username is required.';
    if (!credentials.password) newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const response = await authAPI.login(credentials);
      const { token, agentId, username, fullName, email } = response.data;
      login(token, { agentId, username, fullName, email });
      toast.success(`Welcome back, ${fullName}!`);
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex items-stretch relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] bg-primary/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] bg-accent/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Left: Spline Robot */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
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

      {/* Right: Login Form */}
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
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                <input
                  type="text" id="username" name="username" placeholder="Enter your username"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-background/80 border text-sm text-foreground placeholder:text-muted-foreground/60
                    focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all
                    ${errors.username ? 'border-red-500/50' : 'border-border/50'}`}
                  value={credentials.username} onChange={handleChange} disabled={loading}
                />
                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-background/80 border text-sm text-foreground placeholder:text-muted-foreground/60
                      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all
                      ${errors.password ? 'border-red-500/50' : 'border-border/50'}`}
                    value={credentials.password} onChange={handleChange} disabled={loading}
                  />
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-5 p-3 rounded-xl bg-primary/5 border border-primary/15 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Demo Credentials</p>
              <p className="text-sm font-mono font-medium text-foreground">agent1 / password123</p>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline transition-colors">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
