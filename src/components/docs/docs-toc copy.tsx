import * as React from "react"

export interface TocProps {
  headings: TocItem[]
  /** 顶部偏移量，默认与页面 header 匹配 */
  offset?: number
}

/** 右侧目录：h2 为主，h3 缩进；滚动时同步高亮当前小节 */
export const DocsTOC = ({ headings, offset = 140 }: TocProps) => {
  const items = React.useMemo(
    () => headings.filter((h) => h.depth <= 3),
    [headings]
  )

  const navRef = React.useRef<HTMLElement>(null)
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null)

  /**
   * 滚动同步高亮
   * 依赖 items 变化重新收集目标；rAF 节流避免 scroll 高频 setState
   */
  React.useEffect(() => {
    if (items.length === 0) return
    const nav = navRef.current
    if (!nav) return

    const links = Array.from(
      nav.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")
    )
    const targets: { el: HTMLElement; slug: string }[] = []
    links.forEach((a) => {
      const id = decodeURIComponent((a.getAttribute("href") || "").slice(1))
      const el = id && document.getElementById(id)
      if (el) targets.push({ el, slug: id })
    })
    if (targets.length === 0) return

    let ticking = false
    const compute = () => {
      const pos = window.scrollY + offset
      let current = targets[0]
      for (const t of targets) {
        if (t.el.offsetTop <= pos) current = t
      }
      setActiveSlug(current.slug)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(compute)
      }
    }

    compute() // 首次立即执行
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [items, offset])

  if (items.length === 0) return null

  return (
    <nav
      ref={navRef}
      className="hidden w-55 shrink-0 xl:block"
      // aria-label={t("doc.toc")}
    >
      <div className="`top-30 sticky max-h-[calc(100vh-9rem)] overflow-y-auto pb-8">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          本页目录
        </p>
        <div className="border-l border-border">
          {items.map((h) => {
            const active = activeSlug === h.slug
            return (
              <a
                key={h.slug}
                href={`#${h.slug}`}
                data-toc-link
                data-active={active ? "true" : undefined}
                className={
                  "block border-l-2 py-1 text-[13px] leading-6 transition-colors " +
                  (h.depth === 2 ? "pl-3.5" : "pl-7") +
                  " " +
                  (active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                {h.text}
              </a>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
