import { Loader2 as LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Loader2({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-spin", className)}
      {...props}
    >
      <LoaderIcon className="h-4 w-4" />
    </div>
  )
}
