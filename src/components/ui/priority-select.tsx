"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Badge } from "./badge"

export type Priority = "low" | "medium" | "high"

interface PriorityOption {
  value: Priority
  label: string
  color: string
}

const priorityOptions: PriorityOption[] = [
  {
    value: "low",
    label: "Low",
    color: "bg-green-500",
  },
  {
    value: "medium", 
    label: "Medium",
    color: "bg-yellow-500",
  },
  {
    value: "high",
    label: "High", 
    color: "bg-red-500",
  },
]

interface PrioritySelectProps {
  value?: Priority
  onValueChange?: (value: Priority) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PrioritySelect({
  value,
  onValueChange,
  placeholder = "Select priority",
  disabled,
  className,
}: PrioritySelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = priorityOptions.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", selectedOption.color)} />
              {selectedOption.label}
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search priority..." />
          <CommandEmpty>No priority found.</CommandEmpty>
          <CommandGroup>
            {priorityOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  onValueChange?.(currentValue as Priority)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", option.color)} />
                  {option.label}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const option = priorityOptions.find((opt) => opt.value === priority)
  
  if (!option) return null

  return (
    <Badge
      variant="secondary"
      className={cn("flex items-center gap-1", className)}
    >
      <div className={cn("h-2 w-2 rounded-full", option.color)} />
      {option.label}
    </Badge>
  )
}