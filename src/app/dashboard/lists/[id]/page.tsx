'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Settings } from 'lucide-react'
import { useList } from '@/hooks/useLists'
import { useTasks } from '@/hooks/useTasks'
import { useTaskFiltersURL } from '@/hooks/useTaskFiltersURL'
import { Task } from '@/lib/supabase/types'
import { TaskFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function ListPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const listId = params.id as string
  
  const { list, loading: listLoading, error: listError } = useList(listId)
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError, 
    createTask, 
    updateTask, 
    toggleCompletion, 
    deleteTask 
  } = useTasks(listId)
  
  // Filter and sort state with URL persistence
  const {
    filters,
    sort,
    setFilters,
    setSort,
    hasActiveFilters,
    hasCustomSort,
    applyFiltersAndSort,
    getFilteredTaskCounts,
  } = useTaskFiltersURL()
  
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if we should show add task form from URL params
  useEffect(() => {
    if (searchParams.get('action') === 'add-task') {
      setShowAddTaskForm(true)
      // Remove the action param from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('action')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleAddTask = () => {
    setShowAddTaskForm(true)
  }

  const handleEditList = () => {
    // This will be implemented when we have the edit functionality
    console.log('Edit list:', list?.id)
  }

  const handleCreateTask = async (data: TaskFormData) => {
    setIsSubmitting(true)
    try {
      await createTask(listId, data)
      setShowAddTaskForm(false)
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return
    
    setIsSubmitting(true)
    try {
      await updateTask(editingTask.id, data)
      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = async (taskId: string) => {
    try {
      await toggleCompletion(taskId)
    } catch (error) {
      console.error('Error toggling task completion:', error)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTaskId) return
    
    try {
      await deleteTask(deletingTaskId)
      setDeletingTaskId(null)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (listLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading list..." />
      </div>
    )
  }

  if (listError) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Failed to load list</p>
              <p className="text-sm text-muted-foreground mb-4">{listError.message}</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">List not found</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1">
      {/* Page header */}
      <div className="border-b border-border bg-background">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Button onClick={handleBack} variant="ghost" size="sm" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Dashboard</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl truncate">
                  {list.name}
                </h1>
                {list.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {list.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddTask} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button onClick={handleEditList} variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Edit List</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              Manage tasks in this list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={tasks}
              loading={tasksLoading}
              error={tasksError?.message || null}
              filters={filters}
              sort={sort}
              onFiltersChange={setFilters}
              onSortChange={setSort}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              showFilters={true}
              showQuickFilters={true}
              compactFilters={false}
              emptyMessage="No tasks in this list"
              emptyDescription="Add your first task to get started with organizing your work."
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Task Form */}
      <TaskForm
        open={showAddTaskForm}
        onOpenChange={setShowAddTaskForm}
        onSubmit={handleCreateTask}
        loading={isSubmitting}
        title="Add New Task"
        description={`Add a new task to "${list?.name}"`}
      />

      {/* Edit Task Form */}
      <TaskForm
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSubmit={handleUpdateTask}
        task={editingTask}
        loading={isSubmitting}
        title="Edit Task"
        description="Update the task details below."
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingTaskId}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}