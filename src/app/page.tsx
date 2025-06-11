'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { PdfUpload } from '@/components/pdf-upload'
import { ChatInterface } from '@/components/chat-interface'
import { PdfViewer } from '@/components/pdf-viewer'
import { PromptSettings } from '@/components/prompt-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface UploadedPdf {
  id: string
  name: string
  size: number
  uploadDate: Date
}

export interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string>('')
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [selectedModel, setSelectedModel] = useState<'Sonnet' | 'Haiku' | 'Opus'>('Sonnet')
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')

  // Generate session ID on first load
  useEffect(() => {
    let storedSessionId = null
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('pdf-chat-session-id', storedSessionId)
    }
    setSessionId(storedSessionId)

    // Load stored data
    const storedPdfs = null
    if (storedPdfs) {
      setUploadedPdfs(JSON.parse(storedPdfs).map((pdf: any) => ({
        ...pdf,
        uploadDate: new Date(pdf.uploadDate)
      })))
    }

    const storedMessages = null
    if (storedMessages) {
      setChatMessages(JSON.parse(storedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })))
    }

    const storedPrompt = localStorage.getItem('custom-prompt')
    if (storedPrompt) {
      setCustomPrompt(storedPrompt)
    }

    const storedModel = localStorage.getItem('selected-model')
    if (storedModel) {
      setSelectedModel(storedModel as 'Sonnet' | 'Haiku' | 'Opus')
    }
  }, [])

  // Save data to localStorage when state changes
  useEffect(() => {
    if (uploadedPdfs.length > 0) {
      localStorage.setItem('uploaded-pdfs', JSON.stringify(uploadedPdfs))
    }
  }, [uploadedPdfs])

  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('chat-messages', JSON.stringify(chatMessages))
    }
  }, [chatMessages])

  useEffect(() => {
    localStorage.setItem('custom-prompt', customPrompt)
  }, [customPrompt])

  useEffect(() => {
    localStorage.setItem('selected-model', selectedModel)
  }, [selectedModel])

  const handlePdfUpload = (newPdfs: UploadedPdf[]) => {
    setUploadedPdfs(prev => [...prev, ...newPdfs])
    if (uploadedPdfs.length === 0 && newPdfs.length > 0) {
      setActiveTab('chat')
    }
  }

  const onRefresh = async () => {

    const userId = localStorage.getItem('pdf-chat-session-id')

    console.log("User id : ", userId);


    if (!userId) {
      console.error('No user_id found in localStorage')
      return
    }

    const formData = new FormData()
    formData.append('user_id', userId)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/delete-user-id`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()


      console.log('User Id cleared:', result)

      localStorage.removeItem('pdf-chat-session-id');
      localStorage.removeItem('uploaded-pdfs');
      localStorage.removeItem('chat-messages');
      localStorage.removeItem('custom-prompt');
      localStorage.removeItem('selected-model');


      window.location.reload();
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }

  }


  const handleClearHistory = async () => {

    const userId = localStorage.getItem('pdf-chat-session-id')

    console.log("User id : ", userId);


    if (!userId) {
      console.error('No user_id found in localStorage')
      return
    }

    const formData = new FormData()
    formData.append('user_id', userId)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/clear-chat-history`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      setChatMessages([]);

      console.log('Chat history cleared:', result)
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }

  }

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      content: message,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, userMessage])

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

      const formData = new FormData();
      formData.append('user_id', sessionId.toString());
      formData.append('query', message);
      formData.append('model', selectedModel);

      if (customPrompt) {
        formData.append('prompt', customPrompt);
      }

      const response = await fetch(`${apiBaseUrl}/ask`, {
        method: 'POST',
        body: formData, // No need to set Content-Type
      });


      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const result = await response.json()



      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        type: 'bot',
        content: result.answer || 'Sorry, I could not process your request.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        type: 'bot',
        content: `I received your message: "${message}". This is a simulated response using the ${selectedModel} model${customPrompt ? ' with your custom prompt' : ''}. (Backend connection failed)`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    }
  }

  const hasPdfs = uploadedPdfs.length > 0

  return (
    <div className="min-h-screen bg-background">
      <Header
        onOpenPromptSettings={() => setIsPromptModalOpen(true)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        hasCustomPrompt={!!customPrompt}
        onRefresh={onRefresh}
        onClearMessage={handleClearHistory}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6 lg:h-[calc(100vh-8rem)]">
            {/* PDF Viewer Sidebar */}
            <div className="lg:col-span-1 h-[calc(100vh-80px)] flex flex-col">
              <PdfViewer
                pdfs={uploadedPdfs}
                onUploadMore={handlePdfUpload}
                sessionId={sessionId}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {!hasPdfs ? (
                <div className="h-full flex items-center justify-center">
                  <PdfUpload
                    onUpload={handlePdfUpload}
                    sessionId={sessionId}
                    isCompact={false}
                  />
                </div>
              ) : (
                <ChatInterface
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  selectedModel={selectedModel}
                  customPrompt={customPrompt}
                  sessionId={sessionId}
                />
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="chat" disabled={!hasPdfs}>Chat</TabsTrigger>
                <TabsTrigger value="pdfs">PDFs ({uploadedPdfs.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-6">
                <PdfUpload
                  onUpload={handlePdfUpload}
                  sessionId={sessionId}
                  isCompact={false}
                />
              </TabsContent>

              <TabsContent value="chat" className="mt-6">
                {hasPdfs && (
                  <ChatInterface
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    selectedModel={selectedModel}
                    customPrompt={customPrompt}
                    sessionId={sessionId}
                  />
                )}
              </TabsContent>

              <TabsContent value="pdfs" className="mt-6">
                <PdfViewer
                  pdfs={uploadedPdfs}
                  onUploadMore={handlePdfUpload}
                  sessionId={sessionId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <PromptSettings
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        prompt={customPrompt}
        onSave={setCustomPrompt}
      />
    </div>
  )
}