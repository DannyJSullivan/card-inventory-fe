import { useState, useCallback } from 'react'

interface ImageFile {
  file: File
  preview: string
  isValid: boolean
  error?: string
}

const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp'
]

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const useImageUpload = () => {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null)

  const validateImageFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const hasValidType = VALID_IMAGE_TYPES.includes(file.type)
    const hasValidExtension = VALID_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )
    
    if (!hasValidType && !hasValidExtension) {
      return {
        isValid: false,
        error: 'Invalid file type. Please select a JPEG, PNG, GIF, BMP, TIFF, or WebP image.'
      }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      }
    }

    return { isValid: true }
  }, [])

  const setImage = useCallback((file: File | null) => {
    if (!file) {
      if (imageFile?.preview) {
        URL.revokeObjectURL(imageFile.preview)
      }
      setImageFile(null)
      return
    }

    const validation = validateImageFile(file)
    
    if (!validation.isValid) {
      setImageFile({
        file,
        preview: '',
        isValid: false,
        error: validation.error
      })
      return
    }

    // Create preview URL for valid images
    const preview = URL.createObjectURL(file)
    
    setImageFile({
      file,
      preview,
      isValid: true
    })
  }, [imageFile?.preview, validateImageFile])

  const clearImage = useCallback(() => {
    setImage(null)
  }, [setImage])

  // Cleanup preview URL when component unmounts
  const cleanup = useCallback(() => {
    if (imageFile?.preview) {
      URL.revokeObjectURL(imageFile.preview)
    }
  }, [imageFile?.preview])

  return {
    imageFile,
    setImage,
    clearImage,
    cleanup,
    isValid: imageFile?.isValid ?? false,
    error: imageFile?.error,
    hasImage: !!imageFile
  }
}
