import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import type { NavigationItem } from "./types"
import { hasActive, isSamePath } from "./utils"

interface Props {
  items: readonly NavigationItem[]
  currentPath: string
  nested?: boolean
}

export const DocsNavigationItem = ({
  items,
  currentPath,
  nested = false,
}: Props) => {
  return (
    <>
      {items.map((e, i) => {
        if (e.hidden) return null
        const key = e.id ?? e.href ?? `${e.title}-${i}`
        const children = e.items?.filter((c) => !c.hidden) ?? []
        const hasChildren = children.length > 0
        const isActive = !!e.href && isSamePath(e.href, currentPath)

        // ---------- 分组：可折叠 ----------
        if (hasChildren) {
          const open = (e.expanded ?? true) || hasActive(e, currentPath)

          return (
            <Collapsible key={key} defaultExpanded={open}>
              <SidebarMenuItem>
                {e.href ? (
                  <SidebarMenuButton href={e.href} isActive={isActive}>
                    <span className="font-medium">{e.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton slot="trigger">
                    <span className="font-medium">{e.title}</span>
                  </SidebarMenuButton>
                )}

                <SidebarMenuAction
                  slot="trigger"
                  aria-label={`Toggle ${e.title}`}
                  className="group/action"
                >
                  <ChevronRightIcon className="transition-transform duration-200 group-aria-expanded/action:rotate-90" />
                </SidebarMenuAction>
              </SidebarMenuItem>

              <CollapsibleContent>
                <SidebarMenuSub className="mr-0 translate-x-0 pr-0">
                  <DocsNavigationItem
                    items={children}
                    currentPath={currentPath}
                    nested
                  />
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        }

        // ---------- 叶子：链接 ----------
        const label = (
          <>
            <span>{e.title}</span>
            {/*<DifficultyBadge difficulty={e.difficulty} />*/}
          </>
        )

        if (nested) {
          return (
            <SidebarMenuSubItem key={key}>
              <SidebarMenuSubButton
                href={e.href ?? "#"}
                isActive={isActive}
                className="justify-between"
                data-astro-prefetch
              >
                {label}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          )
        }

        return (
          <SidebarMenuItem key={key}>
            <SidebarMenuButton
              href={e.href ?? "#"}
              isActive={isActive}
              className="justify-between font-medium"
            >
              {label}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </>
  )
}
