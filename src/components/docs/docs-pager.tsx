import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Pager } from "./types"

interface Props {
  pager?: Pager
}

export const DocsPager = ({ pager }: Props) => {
  if (!pager?.prev && !pager?.next) return null

  return (
    <nav
      aria-label="文档翻页"
      className="mt-12 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2"
    >
      {/* Previous */}
      <div>
        {pager.prev && (
          <Button
            variant="outline"
            className="group h-auto w-full justify-start px-4 py-4 text-left"
          >
            <a href={pager.prev.href}>
              <ChevronLeft className="mr-3 size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />

              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-xs text-muted-foreground">上一篇</span>
                <span className="truncate text-sm font-medium">
                  {pager.prev.title}
                </span>
              </span>
            </a>
          </Button>
        )}
      </div>

      {/* Next */}
      <div>
        {pager.next && (
          <Button
            variant="outline"
            className="group h-auto w-full justify-end px-4 py-4 text-right"
          >
            <a href={pager.next.href}>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-xs text-muted-foreground">下一篇</span>
                <span className="truncate text-sm font-medium">
                  {pager.next.title}
                </span>
              </span>

              <ChevronRight className="ml-3 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        )}
      </div>
    </nav>
  )
}
