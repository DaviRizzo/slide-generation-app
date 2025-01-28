import { Loader2 as LoaderIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Loader2({ className, ...props }: LoaderProps) {
  return (
    <div
      className={cn("animate-spin", className)}
      {...props}
    >
      <LoaderIcon className="h-4 w-4" />
    </div>
  )
}
