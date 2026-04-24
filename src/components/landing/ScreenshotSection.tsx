import { forwardRef } from 'react';

const ScreenshotSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="relative z-10 w-[88%] md:w-[78%] mx-auto -mt-32 md:-mt-48">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-1.5 shadow-[0_30px_120px_-20px_rgba(251,146,60,0.25)] backdrop-blur-md">
        <div className="rounded-[14px] overflow-hidden border border-white/10 bg-[#0b0b14]">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 bg-black/40">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 text-[11px] text-white/40">app.insurly.com/dashboard</span>
          </div>
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80"
            alt="Insurly dashboard preview"
            className="w-full aspect-[16/9] object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
});

ScreenshotSection.displayName = 'ScreenshotSection';
export default ScreenshotSection;