import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import type { NavigationItem } from "./types"

interface Props {
  items: NavigationItem[]
  homeHref?: string
}

export const DocsBreadcrumb = ({ items, homeHref = "/" }: Props) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={homeHref}>Home</BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((e, i) => {
          const isLast = i === items.length - 1

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
