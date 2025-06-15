"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useChatSession } from "@/app/providers/chat-session-provider"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { useUser } from "@/app/providers/user-provider"
import { FeedbackForm } from "@/components/common/feedback-form"
import { SettingsContent } from "../settings/settings-content"
import { AppInfoContent } from "../app-info/app-info-content"
import { CommandHistory } from "../../history/command-history"
import { DrawerHistory } from "../../history/drawer-history"
import { APP_NAME } from "@/lib/config"
import {
  User,
  Gear,
  Question,
  Moon,
  Sun,
  Monitor,
  SignOut,
  Info,
  Keyboard,
  Bug,
  GithubLogo,
  Heart,
  ListMagnifyingGlass
} from "@phosphor-icons/react"

interface UserProfileMenuProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const { theme, setTheme } = useTheme()
  const { signOut, user: authUser } = useUser()
  const router = useRouter()
  const isMobile = useBreakpoint(768)
  const { chats, updateTitle, deleteChat } = useChats()
  const { deleteMessages } = useMessages()
  const { chatId } = useChatSession()
  
  // State for different dialogs
  const [isOpen, setIsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Default user data if not provided
  const userData = user || {
    name: "Guest",
    email: "guest@example.com",
    avatar: undefined
  }

  const initials = userData.name
    ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : "G"

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error("Failed to sign out:", error)
    }
  }

  // History handlers
  const handleSaveEdit = async (id: string, newTitle: string) => {
    await updateTitle(id, newTitle)
  }

  const handleConfirmDelete = async (id: string) => {
    if (id === chatId) {
      setHistoryOpen(false)
    }
    await deleteMessages()
    await deleteChat(id, chatId!, () => router.push("/"))
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-muted flex w-full items-center gap-3 rounded-lg p-2 text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="text-sidebar-foreground text-sm font-medium truncate">
                    {userData.name}
                  </div>
                  <div className="text-sidebar-foreground/70 text-xs truncate">
                    {userData.email}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-2">
            <p className="text-sm">Profile</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent 
          side="right" 
          align="end" 
          className="w-64"
          sideOffset={8}
        >
          <DropdownMenuLabel className="p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userData.name}</span>
                <span className="text-xs text-muted-foreground">{userData.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setSettingsOpen(true)}
            >
              <Gear className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setHistoryOpen(true)}
            >
              <ListMagnifyingGlass className="mr-2 h-4 w-4" />
              <span>History</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard shortcuts</span>
              <Badge variant="outline" className="ml-auto text-xs">
                ?
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
              Theme
            </DropdownMenuLabel>
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{option.label}</span>
                  {theme === option.value && (
                    <Badge variant="outline" className="ml-auto h-5 w-5 p-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </Badge>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setFeedbackOpen(true)}
            >
              <Question className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setFeedbackOpen(true)}
            >
              <Bug className="mr-2 h-4 w-4" />
              <span>Report a bug</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setAboutOpen(true)}
            >
              <Info className="mr-2 h-4 w-4" />
              <span>About {APP_NAME}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <a
                href="https://github.com/babakhalid/aida"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <GithubLogo className="mr-2 h-4 w-4" />
                <span>AIDA on GitHub</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Heart className="mr-2 h-4 w-4" />
              <span>Support the project</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={handleSignOut}
            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <SignOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dialog */}
      {isMobile ? (
        <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DrawerContent>
            <SettingsContent isDrawer onClose={() => setSettingsOpen(false)} />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="gap-0 p-0 sm:max-w-xl">
            <DialogHeader className="border-border border-b px-6 py-4">
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <SettingsContent onClose={() => setSettingsOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Feedback Dialog */}
      {isMobile ? (
        <Drawer open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DrawerContent className="bg-background border-border">
            <FeedbackForm authUserId={authUser?.id} onClose={() => setFeedbackOpen(false)} />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent className="[&>button:last-child]:bg-background overflow-hidden p-0 shadow-xs sm:max-w-md [&>button:last-child]:top-3.5 [&>button:last-child]:right-3 [&>button:last-child]:rounded-full [&>button:last-child]:p-1">
            <FeedbackForm authUserId={authUser?.id} onClose={() => setFeedbackOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* About Dialog */}
      {isMobile ? (
        <Drawer open={aboutOpen} onOpenChange={setAboutOpen}>
          <DrawerContent className="bg-background border-border">
            <div className="px-4 pb-6">
              <img
                src="/banner_ocean.jpg"
                alt={`calm paint generated by ${APP_NAME}`}
                className="h-32 w-full object-cover mb-4 rounded-lg"
              />
              <AppInfoContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogContent className="[&>button:last-child]:bg-background gap-0 overflow-hidden rounded-3xl p-0 shadow-xs sm:max-w-md [&>button:last-child]:rounded-full [&>button:last-child]:p-1">
            <div className="p-0">
              <img
                src="/banner_ocean.jpg"
                alt={`calm paint generated by ${APP_NAME}`}
                className="h-32 w-full object-cover"
              />
            </div>
            <div className="p-4">
              <AppInfoContent />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* History Dialog */}
      {isMobile ? (
        <DrawerHistory
          chatHistory={chats}
          onSaveEdit={handleSaveEdit}
          onConfirmDelete={handleConfirmDelete}
          trigger={<div />}
          isOpen={historyOpen}
          setIsOpen={setHistoryOpen}
        />
      ) : (
        <CommandHistory
          chatHistory={chats}
          onSaveEdit={handleSaveEdit}
          onConfirmDelete={handleConfirmDelete}
          trigger={<div />}
          isOpen={historyOpen}
          setIsOpen={setHistoryOpen}
        />
      )}
    </TooltipProvider>
  )
}