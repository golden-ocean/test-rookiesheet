import { cn } from "@/lib/utils"
import type { Difficulty } from "./types"

const bg: Record<Difficulty, string> = {
  1: "bg-foreground/5",
  2: "bg-foreground/10",
  3: "bg-foreground/20",
  4: "bg-foreground/30",
}

interface Props {
  difficulty?: Difficulty
  className?: string
}

export const DifficultyBadge = ({ difficulty, className }: Props) => {
  if (!difficulty) return null
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-1.5 font-mono text-[11px] leading-5 font-medium text-foreground",
        bg[difficulty],
        className
      )}
    >
      L{difficulty}
    </span>
  )
}
