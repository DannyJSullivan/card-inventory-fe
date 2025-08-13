import { useState } from 'react'

interface FileUploadProps {
  mode: 'csv' | 'html' | 'image' | 'json'
  file: File | null
  onFileChange: (file: File | null) => void
  onError: (error: string | null) => void
}

export const FileUpload = ({ mode, file, onFileChange, onError }: FileUploadProps) => {
  const [dragOver, setDragOver] = useState(false)

  const getAcceptedTypes = () => {
    switch (mode) {
      case 'csv': return '.csv'
      case 'html': return '.html,.htm'
      case 'image': return '.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp'
      default: return ''
    }
  }

  const getFileTypeDescription = () => {
    switch (mode) {
      case 'csv': return 'CSV files'
      case 'html': return 'HTML files'
      case 'image': return 'Image files (JPEG, PNG, GIF, BMP, TIFF, WebP)'
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
      default:
        return false
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (!validateFile(selectedFile)) {
      onError(`Please select a valid ${mode.toUpperCase()} file`)
      onFileChange(null)
      return
    }
    
    // Check file size (10MB limit for images, 5MB for others)
    const maxSize = mode === 'image' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      onError(`File size too large. Maximum size is ${mode === 'image' ? '10MB' : '5MB'}`)
      onFileChange(null)
      return
    }

    onError(null)
    onFileChange(selectedFile)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile) {
      handleFileSelect(selectedFile)
    } else {
      onFileChange(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
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

  const removeFile = () => {
    onFileChange(null)
    onError(null)
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <label className="form-label">
        {mode === 'csv' ? 'CSV File' : mode === 'html' ? 'HTML File' : 'Image File'}
      </label>
      
      {!file ? (
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
              Supports {getFileTypeDescription().toLowerCase()} • Max {mode === 'image' ? '10MB' : '5MB'}
            </div>
          </label>
        </div>
      ) : (
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
              {file.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
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
