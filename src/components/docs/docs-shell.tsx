import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DocsBreadcrumb } from "./docs-breadcrumb"
import { DocsProvider } from "./docs-context"
import { DocsSidebar } from "./docs-sidebar"
import type { NavigationItem } from "./types"

interface Props {
  children: React.ReactNode
  currentPath: string
  navigationData: NavigationItem[]
}

export const DocsShell = ({
  currentPath = "",
  navigationData = [],
  children,
}: Props) => {
  return (
    <DocsProvider value={{ currentPath, navigationData }}>
      <SidebarProvider>
        <DocsSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="items-center" />
              <DocsBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
            {/*<div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="aspect-video rounded-xl bg-muted/50" />
              <div className="aspect-video rounded-xl bg-muted/50" />
              <div className="aspect-video rounded-xl bg-muted/50" />
            </div>
            <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />*/}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DocsProvider>
  )
}
