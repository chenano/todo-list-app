"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, User, LogOut, Settings, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SearchDialog, useSearchDialog, SearchShortcutHint } from "@/components/ui"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { useAuthContext } from "@/contexts/AuthContext"
import { MobileNav } from "./mobile-nav"

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, signOut } = useAuthContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isOpen: isSearchOpen, openSearch, closeSearch } = useSearchDialog()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleMobileNavClose = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mr-3 px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 pr-0">
            <MobileNav onLinkClick={handleMobileNavClose} />
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex flex-1 items-center justify-between space-x-2 lg:justify-start">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-lg font-bold">Todo App</span>
          </Link>

          {/* Search */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:max-w-md">
            <Button
              variant="outline"
              onClick={openSearch}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">Search tasks and lists...</span>
              <SearchShortcutHint className="ml-2" />
            </Button>
          </div>

          {/* User menu */}
          <nav className="flex items-center space-x-2">
            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openSearch}
              className="lg:hidden"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Offline indicator */}
            <OfflineIndicator />

            {/* Theme toggle */}
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.email && (
                      <p className="text-sm font-medium leading-none truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={closeSearch} />
    </header>
  )
}