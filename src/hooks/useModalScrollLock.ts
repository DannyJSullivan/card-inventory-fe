import { useEffect } from 'react'

/**
 * Custom hook to prevent body scrolling when a modal is open
 * @param isOpen - Whether the modal is currently open
 */
export const useModalScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])
}