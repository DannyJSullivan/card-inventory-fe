interface PdfUploadHelpProps {
  visible: boolean
}

export const PdfUploadHelp = ({ visible }: PdfUploadHelpProps) => {
  if (!visible) return null

  return (
    <div className="dashboard-card" style={{ cursor: 'default', padding: '24px', marginTop: '24px' }}>
      <h3 className="dashboard-card-title" style={{ marginBottom: '16px', fontSize: '16px' }}>
        📄 PDF Upload Guidelines
      </h3>
      <div className="text-sm text-[var(--text-secondary)] space-y-4">
        <div>
          <h4 className="text-[var(--text-tertiary)] font-semibold mb-2">Best Results:</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Official card checklists and catalogs</li>
            <li>High-quality scan PDFs with clear text</li>
            <li>Documents with structured layouts (tables, lists)</li>
            <li>Multi-page documents with card sets</li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-[var(--text-tertiary)] font-semibold mb-2">Advantages:</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {['No Conversion', 'Vector Text', 'Large Files', 'Multi-Page'].map(advantage => (
              <span key={advantage} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[11px] font-medium border" style={{ borderColor: 'var(--border-secondary)' }}>
                {advantage}
              </span>
            ))}
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>Direct AI processing (no conversion required)</li>
            <li>Preserves text formatting and structure</li>
            <li>Supports larger files (up to 50MB)</li>
            <li>Better accuracy than scanned images</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[var(--text-tertiary)] font-semibold mb-2">Tips for Better Extraction:</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Use text-based PDFs rather than scanned images</li>
            <li>Ensure consistent formatting throughout</li>
            <li>Include card numbers, names, and parallel information</li>
            <li>Structured data (tables) works best</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Processing Time:</strong> Typically 30-45 seconds depending on PDF size and complexity. 
            PDFs often provide the highest quality extraction results.
          </p>
        </div>
      </div>
    </div>
  )
}
