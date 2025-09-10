'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLists } from '@/hooks/useLists'
import { List } from '@/lib/supabase/types'
import { ListFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { ListGrid } from '@/components/lists/ListGrid'
import { ListForm } from '@/components/lists/ListForm'
import { DeleteListDialog } from '@/components/lists/DeleteListDialog'

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut } = useAuthContext()
  const { lists, loading, error, createList, updateList, deleteList } = useLists()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingList, setDeletingList] = useState<(List & { task_count: number }) | null>(null)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleCreateList = () => {
    setShowCreateForm(true)
  }

  // Check for create list action from URL params (from mobile nav)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('action') === 'create-list') {
      setShowCreateForm(true)
      // Clean up URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('action')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [])

  const handleEditList = (list: List) => {
    setEditingList(list)
    setShowEditForm(true)
  }

  const handleDeleteList = (listId: string) => {
    const list = lists.find(l => l.id === listId)
    if (list) {
      setDeletingList(list)
      setShowDeleteDialog(true)
    }
  }

  const handleListClick = (listId: string) => {
    router.push(`/dashboard/lists/${listId}`)
  }

  const handleAddTask = (listId: string) => {
    router.push(`/dashboard/lists/${listId}?action=add-task`)
  }

  const handleCreateSubmit = async (data: ListFormData) => {
    await createList(data)
  }

  const handleEditSubmit = async (data: ListFormData) => {
    if (editingList) {
      await updateList(editingList.id, data)
      setEditingList(null)
    }
  }

  const handleDeleteConfirm = async (listId: string) => {
    await deleteList(listId)
    setDeletingList(null)
  }

  const handleCloseCreateForm = () => {
    setShowCreateForm(false)
  }

  const handleCloseEditForm = () => {
    setShowEditForm(false)
    setEditingList(null)
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeletingList(null)
  }

  return (
    <div className="flex-1">
      {/* Page header */}
      <div className="border-b border-border bg-background">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                My Lists
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Organize your tasks with custom lists
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleCreateList} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create List</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <ListGrid
          lists={lists}
          loading={loading}
          error={error?.message || null}
          onListClick={handleListClick}
          onEditList={handleEditList}
          onDeleteList={handleDeleteList}
          onAddTask={handleAddTask}
          onCreateList={handleCreateList}
        />
      </div>

      {/* Create List Form */}
      <ListForm
        open={showCreateForm}
        onOpenChange={handleCloseCreateForm}
        onSubmit={handleCreateSubmit}
        title="Create New List"
        description="Create a new list to organize your tasks."
        submitText="Create List"
      />

      {/* Edit List Form */}
      <ListForm
        open={showEditForm}
        onOpenChange={handleCloseEditForm}
        onSubmit={handleEditSubmit}
        initialData={editingList || undefined}
        title="Edit List"
        description="Update your list name and description."
        submitText="Save Changes"
      />

      {/* Delete List Dialog */}
      <DeleteListDialog
        open={showDeleteDialog}
        onOpenChange={handleCloseDeleteDialog}
        list={deletingList}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}