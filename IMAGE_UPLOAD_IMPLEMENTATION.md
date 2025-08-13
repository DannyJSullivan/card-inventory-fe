# Image & PDF Upload Implementation Summary

## Overview
This implementation adds support for uploading both image files (JPEG, PNG, GIF, BMP, TIFF, WebP) and PDF files to the card import system. Users can now upload screenshots, photos of card checklists, scanned catalogs, or official PDF documents for AI-powered card data extraction.

## Frontend Components Added/Updated

### 1. Enhanced Import Service (`src/services/imports.ts`)
- Added `uploadImage()` method that calls `/admin/imports/upload-image`
- Added `uploadPdf()` method that calls `/admin/imports/upload-pdf`
- Enhanced error handling for specific HTTP status codes (400, 500, 502, 504)
- PDF-specific error handling with 50MB file size messaging
- Follows same API pattern as existing CSV/HTML uploads

### 2. File Upload Component (`src/components/FileUpload.tsx`)
- Drag & drop support for all file types (CSV, HTML, Image, PDF)
- File validation with appropriate error messages
- Support for all backend-specified image formats + PDF
- Dynamic file size validation (50MB for PDFs, 10MB for others)
- Clean UI with file preview and removal options

### 3. Image Preview Component (`src/components/ImagePreview.tsx`)
- Shows selected image before upload
- Displays file name and size
- Automatic cleanup of object URLs
- Only visible in image mode

### 4. Upload Progress Component (`src/components/UploadProgress.tsx`)
- Multi-stage progress indicator for image and PDF processing
- Realistic timing based on processing expectations:
  - Images: 30-60 seconds
  - PDFs: 30-45 seconds
- Different progress patterns for each file type
- Visual feedback with progress bar and status messages

### 5. Image Upload Help Component (`src/components/ImageUploadHelp.tsx`)
- Guidelines for best image types (checklists, screenshots, etc.)
- Supported format badges (JPEG, PNG, GIF, BMP, TIFF, WebP)
- Tips for better AI extraction results
- Processing time expectations

### 6. PDF Upload Help Component (`src/components/PdfUploadHelp.tsx`)
- Guidelines for best PDF types (official documents, catalogs)
- Advantages of PDF format (no conversion, vector text, larger files)
- Tips for better extraction from text-based PDFs
- Processing time expectations (30-45 seconds)

### 7. Image Upload Hook (`src/hooks/useImageUpload.ts`)
- Reusable hook for image file validation and state management
- Automatic preview URL creation and cleanup
- Comprehensive file validation (type, size, format)
- Error handling with descriptive messages

## Updated Components

### Import Upload Page (`src/pages/ImportUploadPage.tsx`)
- Added IMAGE and PDF mode toggle buttons
- Integrated all new components
- Updated loading messages for image and PDF processing
- Enhanced workflow instructions and tips
- Progress indicator during upload
- Conditional help components based on selected mode

## Features Implemented

### ✅ Core Functionality
- [x] Image file upload with drag & drop
- [x] PDF file upload with drag & drop
- [x] Support for all backend-specified formats
- [x] File validation and error handling
- [x] Integration with existing import workflow
- [x] Progress tracking during upload/processing

### ✅ User Experience
- [x] Image preview before upload
- [x] Drag & drop interface for all file types
- [x] Clear error messages
- [x] Processing time indicators
- [x] Upload guidelines and tips for both images and PDFs
- [x] Dynamic file size limits based on file type

### ✅ Error Handling
- [x] File type validation for images and PDFs
- [x] Dynamic file size limits (10MB for images, 50MB for PDFs)
- [x] HTTP status code specific error messages
- [x] Graceful failure handling

### ✅ Integration
- [x] Seamless integration with existing CSV/HTML workflow
- [x] Same preview/resolve/commit flow
- [x] Consistent UI design
- [x] TypeScript support

## API Integration

The frontend now properly integrates with both image and PDF backend endpoints:

### Image Upload
```typescript
POST /admin/imports/upload-image
// Form data structure
const formData = new FormData()
formData.append('file', file) // Image file
formData.append('brand', metadata.brand)
formData.append('set_name', metadata.set_name)
formData.append('year', String(metadata.year))
formData.append('sport', metadata.sport)
if (metadata.release_date) formData.append('release_date', metadata.release_date)
if (metadata.source) formData.append('source', metadata.source)
```

### PDF Upload
```typescript
POST /admin/imports/upload-pdf
// Same form data structure as images
const formData = new FormData()
formData.append('file', file) // PDF file
formData.append('brand', metadata.brand)
formData.append('set_name', metadata.set_name)
formData.append('year', String(metadata.year))
formData.append('sport', metadata.sport)
if (metadata.release_date) formData.append('release_date', metadata.release_date)
if (metadata.source) formData.append('source', metadata.source)
```

## User Workflow

1. **Select File Type**: Click CSV, HTML, IMAGE, or PDF toggle button
2. **Upload File**: Drag & drop or click to select appropriate file type
3. **Preview**: View file details and any applicable preview
4. **Process**: Click "Upload & Preview" to send to AI processing
5. **Review**: Same preview/resolve/commit flow as CSV/HTML

## File Type Comparison

| Type | Max Size | Processing Time | Best For |
|------|----------|----------------|----------|
| **CSV** | 10MB | Fast | Raw data files |
| **HTML** | 10MB | Medium | Web exports |
| **Image** | 10MB | 30-60 seconds | Photos, screenshots |
| **PDF** | 50MB | 30-45 seconds | Official documents |

## Advantages by File Type

### Images
- Great for screenshots and photos
- Works with various formats
- Good for quick captures

### PDFs  
- **No Conversion Required**: Processed directly by AI
- **Higher Quality**: Vector text and precise formatting preserved
- **Larger File Support**: 50MB limit vs 10MB for images
- **Professional Documents**: Ideal for official checklists and catalogs
- **Multi-Page Support**: Can handle complex documents

## Next Steps for Backend Integration

When you implement the backend endpoints, ensure:

### Image Endpoint
1. **Endpoint**: `POST /admin/imports/upload-image`
2. **Response Format**: Same as CSV/HTML uploads (`UploadPreviewResponse`)
3. **Error Codes**: 400 (invalid file), 500 (server error), 502 (AI error), 504 (timeout)
4. **Processing**: Extract card data from image using AI vision
5. **Validation**: Support JPEG, PNG, GIF, BMP, TIFF, WebP

### PDF Endpoint
1. **Endpoint**: `POST /admin/imports/upload-pdf`
2. **Response Format**: Same as other uploads (`UploadPreviewResponse`)
3. **Error Codes**: Same as image endpoint
4. **Processing**: Direct PDF processing with AI (no conversion)
5. **Validation**: Support PDF files up to 50MB

## Testing

To test the implementation:

1. Try uploading different image formats (JPEG, PNG, etc.)
2. Try uploading PDF files
3. Test file size validation (>10MB for images, >50MB for PDFs should fail)
4. Test invalid file types
5. Verify error handling for each file type
6. Check that the workflow continues normally after successful upload

The frontend is now ready to handle both image and PDF uploads once you implement the backend endpoints!
