'use client'

import { Moon, Sun, Settings, Bot, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'


interface HeaderProps {
  onOpenPromptSettings: () => void
  selectedModel: 'Sonnet' | 'Haiku' | 'Opus'
  onModelChange: (model: 'Sonnet' | 'Haiku' | 'Opus') => void
  hasCustomPrompt: boolean,
  onClearMessage: () => void,
  onRefresh: () => void

}

export function Header({
  onOpenPromptSettings,
  selectedModel,
  onModelChange,
  hasCustomPrompt,
  onClearMessage,
  onRefresh
}: HeaderProps) {
  const { setTheme, theme } = useTheme()

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PDF Chat</h1>
              <p className="text-sm text-muted-foreground">
                Chat with your documents using AI
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Model Selector */}
            <Button variant="outline" size="sm" onClick={() => onRefresh()}>
              {"Refresh"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedModel} <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 w-40">
                <DropdownMenuItem onClick={() => onModelChange('Sonnet')}>Sonnet</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModelChange('Haiku')}>Haiku</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onModelChange('Opus')}>Opus</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Prompt Settings */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPromptSettings}
              className={hasCustomPrompt ? 'border-primary' : ''}
            >
              <span className='pr-1 hidden sm:inline'>Customize your prompt </span>
              <Settings className="w-4 h-4" />
            </Button>

            {/* Clear Chat Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearMessage}
            >
              <span className="pr-1 hidden sm:inline">Clear Chat</span>
              <X className="w-4 h-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}