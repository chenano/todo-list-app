"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, List, Settings, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
    },
    {
      name: "All Lists",
      href: "/dashboard/lists",
      icon: List,
      current: pathname.startsWith("/dashboard/lists"),
    },
  ]

  return (
    <div className={cn("hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col", className)}>
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-lg font-bold">Todo App</span>
          </Link>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ScrollArea className="flex-1">
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h2 className="mb-2 text-sm font-semibold tracking-tight text-muted-foreground">
                  Quick Actions
                </h2>
                <div className="space-y-1">
                  <Button asChild className="w-full justify-start h-9">
                    <Link href="/dashboard?action=create-list">
                      <Plus className="mr-2 h-4 w-4" />
                      New List
                    </Link>
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Navigation */}
              <div>
                <h2 className="mb-2 text-sm font-semibold tracking-tight text-muted-foreground">
                  Navigation
                </h2>
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Button
                      key={item.name}
                      variant={item.current ? "secondary" : "ghost"}
                      className="w-full justify-start h-9"
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Settings */}
              <div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9"
                    asChild
                  >
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </nav>
      </div>
    </div>
  )
}