interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-md bg-border",
        className,
      ].join(" ")}
    />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 bg-card rounded-lg border border-border border-l-[3px] px-4 py-4">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
