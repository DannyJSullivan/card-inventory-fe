import { useState, useEffect } from 'react'

interface UploadProgressProps {
  isUploading: boolean
  mode: 'csv' | 'html' | 'image' | 'json'
}

export const UploadProgress = ({ isUploading, mode }: UploadProgressProps) => {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')

  useEffect(() => {
    if (!isUploading) {
      setProgress(0)
      setStage('')
      return
    }

    let interval: ReturnType<typeof setInterval>
    let timeoutId: ReturnType<typeof setTimeout>

    if (mode === 'image') {
      // Image processing stages with realistic timing
      const stages = [
        { progress: 10, stage: 'Uploading file...', duration: 2000 },
        { progress: 30, stage: 'Processing image...', duration: 5000 },
        { progress: 60, stage: 'Extracting card data...', duration: 15000 },
        { progress: 85, stage: 'Validating data...', duration: 10000 },
        { progress: 95, stage: 'Finalizing...', duration: 3000 }
      ]

      let currentStageIndex = 0
      
      const updateProgress = () => {
        if (currentStageIndex < stages.length) {
          const currentStage = stages[currentStageIndex]
          setProgress(currentStage.progress)
          setStage(currentStage.stage)
          
          timeoutId = setTimeout(() => {
            currentStageIndex++
            updateProgress()
          }, currentStage.duration)
        }
      }
      
      updateProgress()
    } else {
      // Simpler progress for CSV/HTML
      let currentProgress = 0
      interval = setInterval(() => {
        currentProgress += 10
        if (currentProgress <= 90) {
          setProgress(currentProgress)
          if (currentProgress <= 30) {
            setStage('Uploading...')
          } else if (currentProgress <= 70) {
            setStage('Processing...')
          } else {
            setStage('Finalizing...')
          }
        }
      }, 500)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isUploading, mode])

  if (!isUploading) return null

  return (
    <div style={{ 
      marginTop: '16px',
      padding: '16px',
      border: '1px solid var(--border-primary)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-tertiary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div className="animate-spin" style={{ 
          width: '16px', 
          height: '16px', 
          border: '2px solid var(--border-primary)', 
          borderTop: '2px solid var(--accent-primary)', 
          borderRadius: '50%' 
        }} />
        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
          {stage || 'Processing...'}
        </span>
      </div>
      
      <div style={{ 
        width: '100%', 
        height: '6px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div 
          style={{ 
            width: `${progress}%`, 
            height: '100%', 
            backgroundColor: 'var(--accent-primary)', 
            transition: 'width 0.3s ease',
            borderRadius: '3px'
          }} 
        />
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        color: 'var(--text-secondary)', 
        marginTop: '8px',
        textAlign: 'center'
      }}>
        {mode === 'image' && 'Image processing typically takes 30-60 seconds'}
        {mode === 'html' && 'Converting HTML to PDF and extracting data'}
        {mode === 'csv' && 'Processing CSV data'}
      </div>
    </div>
  )
}
