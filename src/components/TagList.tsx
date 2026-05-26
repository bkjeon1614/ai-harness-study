import { TagChip } from './TagChip';

interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <TagChip key={tag} label={tag} />
      ))}
    </div>
  );
}
