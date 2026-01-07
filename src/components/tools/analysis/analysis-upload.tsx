'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'

interface AnalysisUploadProps {
  onUpload: (file: File) => void
  isAnalyzing: boolean
}

export function AnalysisUpload({ onUpload, isAnalyzing }: AnalysisUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile.type === 'application/pdf' || droppedFile.type === 'application/msword' || droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            setFile(droppedFile)
        } else {
            toast.error('Format de fichier non supporté. Veuillez utiliser PDF ou Word.')
        }
    }
  }

  const handleSubmit = () => {
    if (file) {
      onUpload(file)
    }
  }

  const removeFile = () => {
    setFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        
        {!file ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium">
                Glissez-déposez votre CV ici
              </p>
              <p className="text-sm text-muted-foreground">
                ou <Button variant="link" className="px-1" onClick={() => inputRef.current?.click()}>parcourez vos fichiers</Button>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, DOC ou DOCX (Max 5MB)
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Button 
        className="w-full" 
        size="lg" 
        disabled={!file || isAnalyzing}
        onClick={handleSubmit}
      >
        {isAnalyzing ? 'Analyse en cours...' : 'Analyser mon CV'}
      </Button>
    </div>
  )
}
