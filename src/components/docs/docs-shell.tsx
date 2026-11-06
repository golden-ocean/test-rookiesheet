import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { MarkdownHeading } from "astro"
import { DocsBreadcrumb } from "./docs-breadcrumb"
import { DocsContent } from "./docs-content"
import { DocsProvider } from "./docs-context"
import { DocsPager } from "./docs-pager"
import { DocsSidebar } from "./docs-sidebar"
import { DocsToc } from "./docs-toc"
import type { BreadcrumbItem, NavigationItem, Pager } from "./types"

interface Props {
  children: React.ReactNode
  currentPath: string
  navigationData: NavigationItem[]
  breadcrumbData: BreadcrumbItem[]
  pagerData: Pager
  headings: MarkdownHeading[]
}

export const DocsShell = ({
  currentPath = "",
  navigationData = [],
  breadcrumbData = [],
  headings = [],
  pagerData,
  children,
}: Props) => {
  return (
    <DocsProvider value={{ currentPath, navigationData }}>
      <SidebarProvider>
        <DocsSidebar />

        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background">
            <div className="flex min-w-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <DocsBreadcrumb items={breadcrumbData} />
            </div>
          </header>

          {/* Main Content */}
          <div className="grid flex-1 grid-cols-1 gap-4 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8 xl:px-8">
            {/* Article */}
            <article className="min-w-0">
              <DocsContent>{children}</DocsContent>
              <DocsPager pager={pagerData} />
            </article>

            {/* TOC */}
            <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-7rem)] overflow-y-auto lg:block">
              <DocsToc headings={headings} />
            </aside>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DocsProvider>
  )
}
