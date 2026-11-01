import { createContext, useContext, type ReactNode } from "react"
import type { NavigationItem } from "./types"

export type DocsContextValue = {
  // locale: Locale
  currentPath: string
  navigationData: NavigationItem[]
  // localeOptions: LocaleOption[]
}

const DocsContext = createContext<DocsContextValue | null>(null)

export function DocsProvider(props: {
  value: DocsContextValue
  children: ReactNode
}) {
  return <DocsContext value={props.value}>{props.children}</DocsContext>
}

export const useDocs = (): DocsContextValue => {
  const ctx = useContext(DocsContext)
  if (!ctx) throw new Error("useDoc must be used inside <DocProvider>")
  return ctx
}
