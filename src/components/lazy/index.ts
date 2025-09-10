// Lazy-loaded components for better performance
import { lazy } from 'react';

// Lazy load heavy components that are not immediately needed
export const TaskForm = lazy(() => import('@/components/tasks/TaskForm').then(module => ({ default: module.TaskForm })));
export const ListForm = lazy(() => import('@/components/lists/ListForm').then(module => ({ default: module.ListForm })));
export const DeleteListDialog = lazy(() => import('@/components/lists/DeleteListDialog').then(module => ({ default: module.DeleteListDialog })));
export const TaskFilterSort = lazy(() => import('@/components/tasks/TaskFilterSort').then(module => ({ default: module.TaskFilterSort })));

// Lazy load demo components
export const TaskComponentsDemo = lazy(() => import('@/components/tasks/demo').then(module => ({ default: module.TaskComponentsDemo })));