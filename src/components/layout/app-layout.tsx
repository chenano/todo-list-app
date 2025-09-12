"use client"

import { ReactNode } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { KeyboardShortcutHelp } from "@/components/ui/keyboard-shortcut-help"
import { GlobalShortcuts } from "@/components/keyboard"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Global keyboard shortcuts */}
      <GlobalShortcuts />
      
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
      
      {/* Keyboard shortcut help overlay */}
      <KeyboardShortcutHelp />
    </div>
  )
}