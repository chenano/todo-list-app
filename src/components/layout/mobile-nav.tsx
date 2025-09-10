"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, List, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MobileNavProps {
  onLinkClick?: () => void
}

export function MobileNav({ onLinkClick }: MobileNavProps) {
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

  const handleLinkClick = () => {
    onLinkClick?.()
  }

  return (
    <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Todo App
          </h2>
          <div className="space-y-2">
            <Button 
              asChild 
              className="w-full justify-start h-12 text-base"
              onClick={handleLinkClick}
            >
              <Link href="/dashboard?action=create-list">
                <Plus className="mr-3 h-5 w-5" />
                New List
              </Link>
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground uppercase">
            Navigation
          </h2>
          <div className="space-y-2">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={item.current ? "secondary" : "ghost"}
                className="w-full justify-start h-12 text-base"
                asChild
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground uppercase">
            Account
          </h2>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base"
              asChild
              onClick={handleLinkClick}
            >
              <Link href="/settings">
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}