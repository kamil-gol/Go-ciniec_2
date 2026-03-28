"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <div className="relative inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer peer"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background pointer-events-none dark:border-neutral-500",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "hover:border-primary/80 hover:bg-primary/5 dark:hover:border-primary/60 dark:hover:bg-primary/10",
            "peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary dark:peer-checked:bg-primary dark:peer-checked:border-primary",
            "flex items-center justify-center",
            className
          )}
        >
          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
