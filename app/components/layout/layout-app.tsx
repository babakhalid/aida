"use client"

import { Header } from "@/app/components/layout/header"
import { AppSidebar } from "@/app/components/layout/sidebar/app-sidebar"
import { useUserPreferences } from "@/app/providers/user-preferences-provider"
import { useUser } from "@/app/providers/user-provider"

export function LayoutApp({ children }: { children: React.ReactNode }) {
  const { preferences } = useUserPreferences()
  const { user } = useUser()
  const isAuthenticated = !!user
  const hasSidebar = isAuthenticated // Show sidebar only when authenticated

  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden">
      {hasSidebar && <AppSidebar />}
      <main className="@container relative h-dvh w-0 flex-shrink flex-grow overflow-y-auto">
        <Header hasSidebar={hasSidebar} />
        {children}
      </main>
    </div>
  )
}
