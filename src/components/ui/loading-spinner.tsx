import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
  inline?: boolean
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  text,
  inline = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  if (text) {
    return (
      <div className={cn(
        "flex items-center gap-2",
        inline ? "inline-flex" : "justify-center py-4",
        className
      )}>
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          {text}
        </span>
      </div>
    )
  }

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
    />
  )
}