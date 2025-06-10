'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { UploadedPdf } from '@/app/page'

interface PdfUploadProps {
  onUpload: (pdfs: UploadedPdf[]) => void
  sessionId: string
  isCompact?: boolean
}

export function PdfUpload({ onUpload, sessionId, isCompact = false }: PdfUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    )
    
    if (files.length === 0) {
      setError('Please select only PDF files')
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    setError('')
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.type === 'application/pdf'
    )
    
    if (files.length === 0) {
      setError('Please select only PDF files')
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    setError('')
  }, [])

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('user_id', sessionId)
      
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${apiBaseUrl}/upload-pdf`, {
        method: 'POST',
        body: formData,
      })

      // if (!response.ok) {
      //   throw new Error('Upload failed')
      // }

      // const result = await response.json()
      
      // Create uploaded PDF objects
      const uploadedPdfs: UploadedPdf[] = selectedFiles.map(file => ({
        id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        uploadDate: new Date()
      }))

      onUpload(uploadedPdfs)
      setSelectedFiles([])
      
    } catch (err) {
      setError('Failed to upload PDFs. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  if (isCompact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload-compact"
              />
              <label
                htmlFor="pdf-upload-compact"
                className="flex items-center space-x-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add more PDFs</span>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                size="sm"
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-muted rounded p-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Upload Your PDFs</h2>
          <p className="text-muted-foreground">
            Upload one or more PDF files to start chatting with your documents
          </p>
        </div>

        <div
          className={`file-upload-area border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragOver ? 'drag-over' : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="cursor-pointer block"
          >
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Drop PDF files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports multiple PDF files
            </p>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">Selected Files:</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} PDF${selectedFiles.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}