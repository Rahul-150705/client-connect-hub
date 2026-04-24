import { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

const SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

const HeroSplineBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <Suspense
        fallback={
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#13132b] to-[#0a0a14]" />
        }
      >
        <Spline scene={SCENE_URL} className="!w-full !h-full" />
      </Suspense>
      {/* Edge & bottom fade overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#08080f] via-[#08080f]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#08080f]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#08080f]/80 to-transparent" />
    </div>
  );
};

export default HeroSplineBackground;