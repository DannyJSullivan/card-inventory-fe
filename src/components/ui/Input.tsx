import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    const inputStyles = `
      block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
      bg-gray-50 dark:bg-gray-700 
      border-gray-200 dark:border-gray-600
      text-gray-900 dark:text-white 
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-0 
      ${error 
        ? 'border-red-400 focus:border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500' 
        : 'hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-600'
      }
      ${className}
    `

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          className={inputStyles}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-2">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'