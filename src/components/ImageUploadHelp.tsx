interface ImageUploadHelpProps {
  visible: boolean
}

export const ImageUploadHelp = ({ visible }: ImageUploadHelpProps) => {
  if (!visible) return null

  return (
    <div className="dashboard-card" style={{ cursor: 'default', padding: '24px', marginTop: '24px' }}>
      <h3 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '16px' }}>
        📸 Image Upload Guidelines
      </h3>
      <div className="text-sm text-[var(--text-secondary)] space-y-4">
        <div>
          <h4 className="text-[var(--text-tertiary)] font-semibold mb-2">Best Results:</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>High-resolution screenshots of card checklists</li>
            <li>Clear photos of physical card sets or parallels lists</li>
            <li>Screenshots from auction sites or databases</li>
            <li>Images with good contrast and readable text</li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-[var(--text-tertiary)] font-semibold mb-2">Supported Formats:</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WebP'].map(format => (
              <span key={format} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[11px] font-medium border" style={{ borderColor: 'var(--border-secondary)' }}>
                {format}
              </span>
            ))}
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>PNG (preferred for screenshots)</li>
            <li>JPEG/JPG (good for photos)</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[var(--text-tertiary)] font-semibold mb-2">Tips for Better Extraction:</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Ensure text is clear and not blurry</li>
            <li>Include card numbers, player names, and parallel info</li>
            <li>Crop out unnecessary content when possible</li>
            <li>Images with tabular data work best</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Processing Time:</strong> Typically 30-60 seconds depending on image complexity. 
            Review the extracted data carefully before staging.
          </p>
        </div>
      </div>
    </div>
  )
}
