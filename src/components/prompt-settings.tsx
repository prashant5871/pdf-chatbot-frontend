'use client'

import { useState, useEffect } from 'react'
import { X, Save, RotateCcw, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PromptSettingsProps {
  isOpen: boolean
  onClose: () => void
  prompt: string
  onSave: (prompt: string) => void
}

export function PromptSettings({ isOpen, onClose, prompt, onSave }: PromptSettingsProps) {
  const [currentPrompt, setCurrentPrompt] = useState(prompt)
  const [showExamples, setShowExamples] = useState(false)

  useEffect(() => {
    setCurrentPrompt(prompt)
  }, [prompt])

  const handleSave = () => {
    onSave(currentPrompt)
    onClose()
  }

  const handleReset = () => {
    setCurrentPrompt('')
  }

  const examplePrompts = [
    {
      title: "Academic Research Assistant",
      prompt: "You are an academic research assistant. When answering questions about the uploaded documents, provide detailed analysis with citations and references. Focus on scholarly interpretation and critical thinking."
    },
    {
      title: "Legal Document Analyzer",
      prompt: "You are a legal document analyzer. When reviewing documents, identify key legal concepts, potential issues, and important clauses. Provide clear explanations of legal terminology and implications."
    },
    {
      title: "Technical Documentation Helper",
      prompt: "You are a technical documentation expert. When answering questions, provide step-by-step explanations, highlight important technical details, and suggest best practices based on the document content."
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Custom Prompt Settings</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Custom Prompt
            </label>
            <Textarea
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="Enter your custom prompt here. This will be included in all chat requests to provide context and instructions to the AI model..."
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This prompt will be sent with every question to provide context and instructions to the AI model.
              Leave empty to use the default system prompt.
            </p>
          </div>

          {showExamples && (
            <div>
              <h3 className="text-sm font-medium mb-3">Example Prompts</h3>
              <div className="space-y-3">
                {examplePrompts.map((example, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{example.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-2">
                        {example.prompt}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPrompt(example.prompt)}
                      >
                        Use This Prompt
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!currentPrompt}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}