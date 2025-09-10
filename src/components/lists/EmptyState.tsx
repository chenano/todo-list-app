'use client';

import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
  className = '',
}: EmptyStateProps) {
  const defaultIcon = <FileText className="h-12 w-12 text-muted-foreground" />;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      
      {actionText && onAction && (
        <Button onClick={onAction} className="gap-2">
          <Plus className="h-4 w-4" />
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;