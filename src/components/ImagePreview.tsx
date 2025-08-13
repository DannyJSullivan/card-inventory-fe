import { useState, useEffect } from 'react'

interface ImagePreviewProps {
  file: File | null
  mode: string
}

export const ImagePreview = ({ file, mode }: ImagePreviewProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (file && mode === 'image') {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      
      // Cleanup function to revoke the object URL
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setImageUrl(null)
    }
  }, [file, mode])

  if (!imageUrl || mode !== 'image') {
    return null
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <label className="form-label">Image Preview</label>
      <div 
        style={{ 
          border: '1px solid var(--border-primary)', 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: 'var(--bg-tertiary)',
          textAlign: 'center'
        }}
      >
        <img 
          src={imageUrl} 
          alt="Upload preview" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '400px', 
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }} 
        />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {file?.name} ({file ? (file.size / 1024 / 1024).toFixed(2) : '0.00'} MB)
        </div>
      </div>
    </div>
  )
}
