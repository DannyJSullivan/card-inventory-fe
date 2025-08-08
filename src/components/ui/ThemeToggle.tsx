import { useTheme } from '../../contexts/ThemeContext'

export const ThemeToggle = () => {
  try {
    const { theme, toggleTheme } = useTheme()

    const buttonStyle = {
      position: 'fixed' as const,
      top: '16px',
      right: '16px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
      border: `1px solid ${theme === 'light' ? '#d1d5db' : '#6b7280'}`,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 9999,
      transition: 'all 0.2s ease'
    }

    const iconStyle = {
      width: '20px',
      height: '20px',
      fill: theme === 'light' ? '#374151' : '#fbbf24'
    }

    const handleClick = () => {
      console.log('Current theme:', theme)
      toggleTheme()
      console.log('Toggle clicked')
    }

    return (
      <button
        onClick={handleClick}
        style={buttonStyle}
        title={`Current: ${theme}. Click to switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          // Sun icon for light mode 
          <svg style={iconStyle} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          // Moon icon for dark mode
          <svg style={iconStyle} viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>
    )
  } catch (error) {
    console.error('ThemeToggle error:', error)
    return (
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        width: '40px',
        height: '40px',
        backgroundColor: 'red',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        ERROR
      </div>
    )
  }
}