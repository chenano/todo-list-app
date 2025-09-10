'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react';
import { List } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ListCardProps {
  list: List & { task_count: number };
  onEdit?: (list: List) => void;
  onDelete?: (listId: string) => void;
  onAddTask?: (listId: string) => void;
  onClick?: (listId: string) => void;
  className?: string;
}

export function ListCard({
  list,
  onEdit,
  onDelete,
  onAddTask,
  onClick,
  className = '',
}: ListCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick(list.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit(list);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(list.id);
    }
  };

  const handleAddTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddTask) {
      onAddTask(list.id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className={`group hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-none tracking-tight truncate">
            {list.name}
          </h3>
          {list.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {list.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          <Badge variant="secondary" className="text-xs">
            {list.task_count} {list.task_count === 1 ? 'task' : 'tasks'}
          </Badge>
          
          {(onEdit || onDelete || onAddTask) && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleMenuClick}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit list
                  </DropdownMenuItem>
                )}
                {onAddTask && (
                  <DropdownMenuItem onClick={handleAddTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add task
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete list
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Created {new Date(list.created_at).toLocaleDateString()}
          </span>
          {list.updated_at !== list.created_at && (
            <span>
              Updated {new Date(list.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ListCard;