"use client";

export function ProfileReviewsStat({
  total,
  change,
}: {
  total: number;
  change: number;
}) {
  return (
    <div
      className="group rounded-lg border border-border/60 bg-bg-sidebar/60 px-3 py-2 transition-all duration-300 hover:border-accent/50 hover:bg-accent/5"
    >
      <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">
        Profile reviews
      </p>
      <p className="text-lg font-semibold text-text-primary mt-0.5">{total.toLocaleString()}</p>
      <p className="text-[10px] text-text-secondary mt-0.5">
        <span className="text-success">+{change}%</span> vs last month
      </p>
    </div>
  );
}
