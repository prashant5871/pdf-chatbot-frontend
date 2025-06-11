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
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  // Helper function for client-side duplicate check (before upload)
  const isFileDuplicateClientSide = useCallback(
    (file: File) => {
      return selectedFiles.some(
        existingFile => existingFile.name === file.name && existingFile.size === file.size
      )
    },
    [selectedFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      setMessage(null)

      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type === 'application/pdf'
      )

      if (droppedFiles.length === 0) {
        setMessage({ text: 'Please select only PDF files.', type: 'error' })
        return
      }

      const newUniqueFiles = droppedFiles.filter(file => !isFileDuplicateClientSide(file))

      if (newUniqueFiles.length === 0 && droppedFiles.length > 0) {
        setMessage({ text: 'All selected PDF files are already in the list for upload.', type: 'info' })
        return
      }

      setSelectedFiles(prev => [...prev, ...newUniqueFiles])
      setMessage(null)
    },
    [isFileDuplicateClientSide]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(null)

      const selectedInputFiles = Array.from(e.target.files || []).filter(
        file => file.type === 'application/pdf'
      )

      if (selectedInputFiles.length === 0) {
        setMessage({ text: 'Please select only PDF files.', type: 'error' })
        e.target.value = '';
        return
      }

      const newUniqueFiles = selectedInputFiles.filter(file => !isFileDuplicateClientSide(file))

      if (newUniqueFiles.length === 0 && selectedInputFiles.length > 0) {
        setMessage({ text: 'All selected PDF files are already in the list for upload.', type: 'info' })
        e.target.value = '';
        return
      }

      setSelectedFiles(prev => [...prev, ...newUniqueFiles])
      setMessage(null)
      e.target.value = '';
    },
    [isFileDuplicateClientSide]
  )

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setMessage(null)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setMessage(null)

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Upload failed: ${errorData.message || response.statusText}`);
      }

      // Parse the response, which now includes 'results' with 'status'
      const result = await response.json()
      const serverUploadResults = result.results || [];

      const successfulUploads: UploadedPdf[] = [];
      const duplicateFiles: string[] = [];
      const failedFiles: string[] = [];

      selectedFiles.forEach(localFile => {
        const serverResult = serverUploadResults.find(
          (sr: any) => sr.filename === localFile.name
        );

        if (serverResult) {
          if (serverResult.status === 'ok') {
            successfulUploads.push({
              id: serverResult.pdf_id, // Use PDF ID from server
              name: localFile.name,
              size: localFile.size,
              uploadDate: new Date()
            });
          } else if (serverResult.status === 'duplicate') {
            duplicateFiles.push(localFile.name);
          } else {
            failedFiles.push(localFile.name); // Handle other potential failure statuses
          }
        } else {
          failedFiles.push(localFile.name); // File sent but no result from server
        }
      });

      let statusMessage = '';
      let messageType: 'success' | 'error' | 'info' = 'success';

      if (successfulUploads.length > 0) {
        statusMessage += `${successfulUploads.length} PDF(s) uploaded successfully! `;
      }
      if (duplicateFiles.length > 0) {
        statusMessage += `${duplicateFiles.length} PDF(s) were already uploaded: ${duplicateFiles.join(', ')}. `;
        messageType = successfulUploads.length > 0 ? 'info' : 'info'; // If some are successful, it's still info/partial success
      }
      if (failedFiles.length > 0) {
        statusMessage += `${failedFiles.length} PDF(s) failed to upload: ${failedFiles.join(', ')}. `;
        messageType = 'error'; // If any fail, the overall status is an error
      }

      if (statusMessage) {
         setMessage({ text: statusMessage.trim(), type: messageType });
      } else {
         // Fallback if no specific messages were generated (shouldn't happen often)
         setMessage({ text: 'Upload process completed with no specific status.', type: 'info' });
      }


      // Only clear selected files and call onUpload for *successfully uploaded* ones
      onUpload(successfulUploads);
      setSelectedFiles(prev => prev.filter(file => !successfulUploads.some(uploaded => uploaded.name === file.name)));


    } catch (err) {
      setMessage({
        text: `Failed to upload PDFs. ${err instanceof Error ? err.message : String(err)}. Please try again.`,
        type: 'error',
      })
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  // Determine message styles based on type
  const messageClasses = message
    ? {
        error: 'text-sm text-destructive mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg',
        success: 'text-sm text-green-700 mt-2 p-3 bg-green-100 border border-green-200 rounded-lg',
        info: 'text-sm text-blue-700 mt-2 p-3 bg-blue-100 border border-blue-200 rounded-lg',
      }[message.type]
    : '';

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

          {message && (
            <p className={messageClasses}>{message.text}</p>
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

        {message && (
          <div className={messageClasses}>
            <p>{message.text}</p>
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