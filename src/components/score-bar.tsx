type Props = {
  label: string;
  value: number; // 1-5
};

export function ScoreBar({ label, value }: Props) {
  const filled = Math.max(0, Math.min(5, value));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs tracking-widest text-[color:var(--color-text-muted)] w-20">
        {label}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`block h-[2px] w-5 ${
              i < filled
                ? "bg-[color:var(--color-gold)]"
                : "bg-[color:var(--color-border)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
