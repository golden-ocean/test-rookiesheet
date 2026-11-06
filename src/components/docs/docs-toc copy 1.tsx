import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import * as React from "react"

export type TocHeading = {
  slug: string
  text: string
  depth: number
}

type DocsTocProps = {
  headings: TocHeading[]
  /** 默认 h2、h3 */
  depths?: number[]
  /** 与固定顶栏高度一致 */
  offsetPx?: number
  className?: string
  title?: string
}

export function DocsTOC({
  headings,
  depths = [2, 3],
  offsetPx = 96,
  className,
  title = "On This Page",
}: DocsTocProps) {
  const items = React.useMemo(
    () => headings.filter((h) => depths.includes(h.depth) && h.slug),
    [headings, depths]
  )

  const [activeId, setActiveId] = React.useState(items[0]?.slug ?? "")

  React.useEffect(() => {
    if (!items.length) return

    const elements = items
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => Boolean(el))

    if (!elements.length) return

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }

        const inView = items.map((h) => h.slug).filter((id) => visible.has(id))

        if (inView.length) {
          setActiveId(inView[0]!)
          return
        }

        // 视口内没有标题时，取最后一个已滚过的
        const y = window.scrollY + offsetPx + 8
        let current = items[0]?.slug ?? ""
        for (const h of items) {
          const el = document.getElementById(h.slug)
          if (el && el.offsetTop <= y) current = h.slug
          else break
        }
        setActiveId(current)
      },
      {
        rootMargin: `-${offsetPx}px 0px -55% 0px`,
        threshold: [0, 1],
      }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items, offsetPx])

  if (!items.length) return null

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-sm font-medium">{title}</p>

      <ScrollArea className="max-h-[calc(100vh-8rem)]">
        <nav aria-label={title}>
          <ul className="flex flex-col gap-0.5 border-l border-border">
            {items.map((heading) => {
              const isActive = heading.slug === activeId

              return (
                <li key={heading.slug}>
                  <a
                    href={`#${heading.slug}`}
                    data-active={isActive || undefined}
                    className={cn(
                      "block border-l-2 border-transparent py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
                      heading.depth === 2 && "pl-3",
                      heading.depth === 3 && "pl-5",
                      isActive && "border-primary font-medium text-foreground"
                    )}
                    onClick={(event) => {
                      const el = document.getElementById(heading.slug)
                      if (!el) return
                      event.preventDefault()
                      const top =
                        el.getBoundingClientRect().top +
                        window.scrollY -
                        offsetPx
                      window.scrollTo({ top, behavior: "smooth" })
                      setActiveId(heading.slug)
                      history.replaceState(null, "", `#${heading.slug}`)
                    }}
                  >
                    {heading.text}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </ScrollArea>
    </div>
  )
}
