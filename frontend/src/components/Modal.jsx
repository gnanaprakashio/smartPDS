import { useEffect } from 'react'

/**
 * Enhanced Modal Component with all required features
 * - X button to close
 * - Outside click to close
 * - Escape key to close
 * - Background scroll lock
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true 
}) => {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // Handle background scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Save original overflow
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    // Lock scroll
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      // Restore scroll
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [isOpen])

  // Handle outside click
  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOutsideClick}
    >
      <div className="modal-content relative">
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Modal header */}
        {title && (
          <div className="mb-6 pr-8">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Modal content */}
        {children}
      </div>
    </div>
  )
}

export default Modal
