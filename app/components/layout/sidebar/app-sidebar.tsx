"use client"

import { groupChatsByDate } from "@/app/components/history/utils"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useUser } from "@/app/providers/user-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useChats } from "@/lib/chat-store/chats/provider"
import {
  ChatTeardropText,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { HistoryTrigger } from "../../history/history-trigger"
import { SidebarList } from "./sidebar-list"
import { UserProfileMenu } from "./user-profile-menu"

export function AppSidebar() {
  const isMobile = useBreakpoint(768)
  const { open, setOpenMobile } = useSidebar()
  const { chats, isLoading } = useChats()
  const { user } = useUser()
  const params = useParams<{ chatId: string }>()
  const currentChatId = params.chatId

  const groupedChats = useMemo(() => groupChatsByDate(chats, ""), [chats])
  const hasChats = chats.length > 0

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="border-none">
      <SidebarHeader className="h-14 pl-3">
        <div className="flex justify-between">
          {isMobile ? (
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-md bg-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <X size={24} />
            </button>
          ) : (
            <div className="h-full" />
          )}
          <AnimatePresence mode="sync" initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15, delay: 0.1, ease: "easeOut" }}
                className="pt-0"
              >
                <HistoryTrigger
                  hasSidebar={false}
                  classNameTrigger="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none bg-transparent"
                  icon={<MagnifyingGlass size={24} />}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarHeader>
      <SidebarContent className="mask-t-from-98% mask-t-to-100% mask-b-from-98% mask-b-to-100% px-3">
        <ScrollArea className="flex h-full [&>div>div]:!block">
          {isLoading ? (
            <div className="h-full" />
          ) : hasChats ? (
            <div className="space-y-5">
              {groupedChats?.map((group) => (
                <SidebarList
                  key={group.name}
                  title={group.name}
                  items={group.chats}
                  currentChatId={currentChatId}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-[calc(100vh-160px)] flex-col items-center justify-center">
              <ChatTeardropText
                size={24}
                className="text-muted-foreground mb-1 opacity-40"
              />
              <div className="text-muted-foreground text-center">
                <p className="mb-1 text-base font-medium">No chats yet</p>
                <p className="text-sm opacity-70">Start a new conversation</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="mb-2 p-3">
        <UserProfileMenu 
          user={user ? {
            name: user.display_name || user.email || "User",
            email: user.email || "",
            avatar: user.profile_image || undefined
          } : undefined}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
