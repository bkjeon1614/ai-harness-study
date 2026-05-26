interface TagChipProps {
  label: string;
}

export function TagChip({ label }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-card border border-border text-foreground rounded-full px-3 py-1 text-xs">
      {label}
    </span>
  );
}
