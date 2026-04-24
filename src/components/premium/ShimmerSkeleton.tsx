import React from 'react';

interface ShimmerSkeletonProps {
  className?: string;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({ className = '' }) => (
  <div className={`shimmer rounded-xl ${className}`} />
);

/** Full dashboard skeleton matching the bento layout. */
export const DashboardSkeleton: React.FC = () => (
  <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-9 w-48" />
        <ShimmerSkeleton className="h-4 w-64" />
      </div>
      <ShimmerSkeleton className="h-10 w-40" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[0, 1, 2, 3].map((i) => (
        <ShimmerSkeleton key={i} className="h-[140px]" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ShimmerSkeleton className="h-[260px]" />
      <ShimmerSkeleton className="h-[260px]" />
    </div>
    <ShimmerSkeleton className="h-[320px]" />
  </div>
);

export default ShimmerSkeleton;