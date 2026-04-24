import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSplineBackground from '@/components/landing/HeroSplineBackground';
import HeroContent from '@/components/landing/HeroContent';
import ScreenshotSection from '@/components/landing/ScreenshotSection';
import Features from '@/components/landing/Features';
import LimelightNav from '@/components/landing/LimelightNav';

const Landing = () => {
  const [heroOpacity, setHeroOpacity] = useState(1);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        // Hero fades out across first 60% of viewport
        const op = Math.max(0, 1 - y / (vh * 0.6));
        setHeroOpacity(op);
        // Parallax on screenshot
        if (screenshotRef.current) {
          const translate = Math.min(120, y * 0.25);
          screenshotRef.current.style.transform = `translate3d(0, ${-translate}px, 0)`;
        }
        tickingRef.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#08080f] text-white antialiased overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative h-screen w-full flex items-center">
        <HeroSplineBackground />
        <HeroContent opacity={heroOpacity} />
      </section>

      {/* Screenshot with parallax */}
      <ScreenshotSection ref={screenshotRef} />

      {/* Features */}
      <Features />

      {/* Limelight nav demo */}
      <section className="relative z-10 pb-24 flex flex-col items-center gap-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Try the navigation</p>
        <LimelightNav />
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Renew AI. Crafted with care.
      </footer>
    </div>
  );
};

export default Landing;
