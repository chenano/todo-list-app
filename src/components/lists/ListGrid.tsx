'use client';

import { List } from '@/lib/supabase/types';
import { ListCard } from './ListCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from './EmptyState';

interface ListGridProps {
  lists: (List & { task_count: number })[];
  loading?: boolean;
  error?: string | null;
  onListClick?: (listId: string) => void;
  onEditList?: (list: List) => void;
  onDeleteList?: (listId: string) => void;
  onAddTask?: (listId: string) => void;
  onCreateList?: () => void;
  className?: string;
}

export function ListGrid({
  lists,
  loading = false,
  error = null,
  onListClick,
  onEditList,
  onDeleteList,
  onAddTask,
  onCreateList,
  className = '',
}: ListGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading lists..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load lists</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <EmptyState
        title="No lists yet"
        description="Create your first list to start organizing your tasks."
        actionText="Create List"
        onAction={onCreateList}
      />
    );
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            onClick={onListClick}
            onEdit={onEditList}
            onDelete={onDeleteList}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </div>
  );
}

export default ListGrid;