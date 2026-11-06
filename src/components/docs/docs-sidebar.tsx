import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { TerminalIcon } from "lucide-react"
import { useDocs } from "./docs-context"
import { DocsNavigationItem } from "./docs-navigation-item"

export const DocsSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const { navigationData, currentPath } = useDocs()
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TerminalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Acme Inc</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-2">
        {navigationData.map((g, i) => (
          <SidebarGroup key={`${g.title}-${i}`}>
            <SidebarGroupLabel>{g.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <DocsNavigationItem
                  items={g.items ?? []}
                  currentPath={currentPath}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>sidebar footer</SidebarFooter>
    </Sidebar>
  )
}
