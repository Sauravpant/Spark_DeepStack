import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-input bg-slate-50 px-3.5 py-1 text-sm shadow-none transition-all duration-200 outline-none",
        "selection:bg-primary selection:text-primary-foreground",
        "placeholder:text-muted-foreground/60",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "hover:border-slate-300",
        "focus-visible:border-[#E3182D] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#E3182D]/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "cursor-text",
        className
      )}
      {...props}
    />
  )
}

export { Input }
