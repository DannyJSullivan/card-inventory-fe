import { useState } from 'react'

interface FileUploadProps {
  mode: 'csv' | 'html' | 'image' | 'pdf' | 'json'
  file: File | null
  files?: File[]
  onFileChange: (file: File | null) => void
  onFilesChange?: (files: File[]) => void
  onError: (error: string | null) => void
  allowMultiple?: boolean
}

export const FileUpload = ({ mode, file, files = [], onFileChange, onFilesChange, onError, allowMultiple = false }: FileUploadProps) => {
  const [dragOver, setDragOver] = useState(false)
  
  const isMultipleMode = allowMultiple && mode === 'pdf'

  const getAcceptedTypes = () => {
    switch (mode) {
      case 'csv': return '.csv'
      case 'html': return '.html,.htm'
      case 'image': return '.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp'
      case 'pdf': return '.pdf'
      default: return ''
    }
  }

  const getFileTypeDescription = () => {
    switch (mode) {
      case 'csv': return 'CSV files'
      case 'html': return 'HTML files'
      case 'image': return 'Image files (JPEG, PNG, GIF, BMP, TIFF, WebP)'
      case 'pdf': return isMultipleMode ? 'PDF documents (multiple files supported)' : 'PDF documents'
      default: return 'Files'
    }
  }

  const validateFile = (file: File) => {
    switch (mode) {
      case 'csv':
        return file.type === 'text/csv' || file.name.endsWith('.csv')
      case 'html':
        return file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')
      case 'image':
        const validImageTypes = [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'image/bmp',
          'image/tiff',
          'image/webp'
        ]
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
        return validImageTypes.includes(file.type) || 
               validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      case 'pdf':
        return file.type === 'application/pdf' || file.type === 'application/x-pdf' || file.name.endsWith('.pdf')
      default:
        return false
    }
  }

  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    
    if (isMultipleMode) {
      // Validate all files
      for (const file of fileArray) {
        if (!validateFile(file)) {
          onError(`Please select valid ${mode.toUpperCase()} files only`)
          return
        }
      }
      
      // Check total size for multiple PDFs (100MB limit)
      const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0)
      const maxTotalSize = 100 * 1024 * 1024 // 100MB
      if (totalSize > maxTotalSize) {
        onError('Total file size too large. Maximum total size is 100MB for multiple PDFs')
        return
      }
      
      onError(null)
      if (onFilesChange) {
        onFilesChange(fileArray)
      }
    } else {
      // Single file mode (existing logic)
      const selectedFile = fileArray[0]
      if (!selectedFile) {
        onFileChange(null)
        return
      }
      
      if (!validateFile(selectedFile)) {
        onError(`Please select a valid ${mode.toUpperCase()} file`)
        onFileChange(null)
        return
      }
      
      // Check file size (50MB limit for PDFs, 10MB for others)
      const maxSize = mode === 'pdf' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (selectedFile.size > maxSize) {
        onError(`File size too large. Maximum size is ${mode === 'pdf' ? '50MB' : '10MB'}`)
        onFileChange(null)
        return
      }

      onError(null)
      onFileChange(selectedFile)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles)
    } else {
      if (isMultipleMode && onFilesChange) {
        onFilesChange([])
      } else {
        onFileChange(null)
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelect(droppedFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = (index?: number) => {
    if (isMultipleMode && onFilesChange) {
      if (typeof index === 'number') {
        // Remove specific file
        const newFiles = files.filter((_, i) => i !== index)
        onFilesChange(newFiles)
      } else {
        // Remove all files
        onFilesChange([])
      }
    } else {
      onFileChange(null)
    }
    onError(null)
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <label className="form-label">
        {mode === 'csv' ? 'CSV File' : mode === 'html' ? 'HTML File' : mode === 'image' ? 'Image File' : isMultipleMode ? 'PDF Files' : 'PDF File'}
      </label>
      
      {(!isMultipleMode && !file) || (isMultipleMode && files.length === 0) ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: dragOver ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          <input
            type="file"
            accept={getAcceptedTypes()}
            multiple={isMultipleMode}
            onChange={handleInputChange}
            style={{ display: 'none' }}
            id={`file-input-${mode}`}
          />
          <label 
            htmlFor={`file-input-${mode}`}
            style={{ 
              cursor: 'pointer', 
              display: 'block',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Drop your {getFileTypeDescription().toLowerCase()} here or click to browse
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Supports {getFileTypeDescription().toLowerCase()} • Max {isMultipleMode ? '100MB total' : mode === 'pdf' ? '50MB' : '10MB'}
            </div>
          </label>
        </div>
      ) : isMultipleMode ? (
        // Multiple files display
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {files.length} PDF file{files.length !== 1 ? 's' : ''} selected
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Total: {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFile()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '16px'
              }}
              title="Remove all files"
            >
              ✕
            </button>
          </div>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} style={{
              border: '1px solid var(--border-primary)',
              borderRadius: '6px',
              padding: '12px 16px',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '14px'
                }}
                title="Remove this file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Single file display
        <div style={{
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {file?.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {file && (file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeFile()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '16px'
            }}
            title="Remove file"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
