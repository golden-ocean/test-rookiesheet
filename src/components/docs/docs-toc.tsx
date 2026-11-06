import { cn } from "@/lib/utils"
import type { MarkdownHeading } from "astro"
import { useEffect, useMemo, useState } from "react"

interface Props {
  headings: MarkdownHeading[]
  title?: string
}

export function DocsToc({ headings, title = "本页目录" }: Props) {
  const [activeId, setActiveId] = useState<string>()

  // 只保留 H2，保持 Astro 原始顺序
  const items = useMemo(
    () => headings.filter((heading) => heading.depth === 2),
    [headings]
  )

  // 默认高亮第一个标题
  const currentActiveId = activeId ?? items[0]?.slug

  /**
   * 监听正文滚动，更新当前目录项
   */
  useEffect(() => {
    if (items.length === 0) return

    const elements = items
      .map((item) => document.getElementById(item.slug))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    let ticking = false

    const updateActive = () => {
      ticking = false

      const threshold = 120
      const scrollTop = window.scrollY
      const scrollBottom = scrollTop + window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // 滚动到页面底部时，高亮最后一个标题
      if (scrollBottom >= documentHeight - 2) {
        setActiveId(elements[elements.length - 1].id)
        return
      }

      // 找到最后一个已经经过视口顶部偏移线的标题
      let current = elements[0]

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= threshold) {
          current = element
        } else {
          break
        }
      }

      setActiveId(current.id)
    }

    const handleScroll = () => {
      if (ticking) return

      ticking = true
      window.requestAnimationFrame(updateActive)
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    })

    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="本页目录">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>

      <ul className="space-y-1 border-l">
        {items.map((item) => {
          const active = currentActiveId === item.slug

          return (
            <li key={item.slug}>
              <a
                href={`#${encodeURIComponent(item.slug)}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "relative block py-1.5 pr-2 pl-4 text-sm leading-6 transition-colors",
                  active
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-primary" />
                )}

                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
