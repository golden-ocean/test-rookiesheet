import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import type { NavigationItem } from "./types"
import { buildBreadcrumbItems } from "./utils"

interface Props {
  items: NavigationItem[]
  currentPath: string
  homeHref?: string
}

export const DocsBreadcrumb = ({
  items,
  currentPath,
  homeHref = "/",
}: Props) => {
  const breadcrumbs = buildBreadcrumbItems(items, currentPath)
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={homeHref}>Home</BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((e, i) => {
          const isLast = i === breadcrumbs.length - 1

          return (
            <BreadcrumbItem key={`${e.title}-${i}`}>
              {isLast ? (
                <BreadcrumbPage>{e.title}</BreadcrumbPage>
              ) : e.href ? (
                <BreadcrumbLink href={e.href}>{e.title}</BreadcrumbLink>
              ) : (
                <span className="text-muted-foreground">{e.title}</span>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
