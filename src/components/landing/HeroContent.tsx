import { Play, ArrowRight } from 'lucide-react';

interface HeroContentProps {
  opacity: number;
}

const HeroContent = ({ opacity }: HeroContentProps) => {
  return (
    <div
      className="relative z-10 max-w-3xl px-6 md:px-12 lg:px-20 transition-opacity duration-150"
      style={{ opacity }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
        New: AI-powered policy insights are live
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
        Insurance management,
        <br />
        <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
          reimagined for scale.
        </span>
      </h1>
      <p className="mt-6 text-base md:text-lg text-white/70 max-w-xl leading-relaxed">
        A unified platform to manage clients, policies and renewals — built for modern brokerages
        that demand speed, clarity and zero friction.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/40">
          Start Free Trial
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white/90 transition-colors hover:text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md transition-all group-hover:bg-white/15">
            <Play className="h-3.5 w-3.5 fill-white" />
          </span>
          Watch Video
        </button>
      </div>
    </div>
  );
};

export default HeroContent;