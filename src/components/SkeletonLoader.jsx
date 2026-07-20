import React from 'react';

/**
 * Shimmer effect base styling
 */
const Shimmer = ({ className }) => {
  return (
    <div className={`animate-pulse bg-neutral-800 rounded-md ${className}`}></div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-[#181818] p-4 rounded-lg flex flex-col gap-3">
      <Shimmer className="aspect-square w-full rounded-md" />
      <Shimmer className="h-5 w-3/4" />
      <Shimmer className="h-4 w-1/2" />
    </div>
  );
};

export const SkeletonRow = () => {
  return (
    <div className="flex items-center gap-4 py-2 px-4 rounded-md">
      <Shimmer className="h-10 w-10 rounded" />
      <div className="flex-1 flex flex-col gap-2">
        <Shimmer className="h-4 w-1/3" />
        <Shimmer className="h-3 w-1/5" />
      </div>
      <Shimmer className="h-4 w-16 hidden sm:block" />
      <Shimmer className="h-4 w-8" />
    </div>
  );
};

export const SkeletonCategory = () => {
  return (
    <Shimmer className="h-32 min-w-[140px] sm:min-w-[180px] rounded-xl" />
  );
};

export const SkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};

export const SkeletonList = ({ count = 5 }) => {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonRow key={idx} />
      ))}
    </div>
  );
};
