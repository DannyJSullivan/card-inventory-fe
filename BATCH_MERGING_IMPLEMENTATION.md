# Batch Merging Feature Implementation

## Overview

The batch merging feature has been successfully implemented in the card inventory frontend. This feature allows users to combine multiple import batches into a single unified batch, which is useful for organizing related card imports that were split across multiple files or uploads.

## Features Implemented

### ✅ **Core Functionality**
- **Batch Selection**: Users can select multiple batches to merge
- **Validation**: Ensures batches have compatible metadata (same brand, set, year, sport)
- **Metadata Preservation**: Maintains all important batch information
- **UI Integration**: Seamlessly integrated into the existing Pending Batches page
- **Error Handling**: Comprehensive error messages and validation
- **Success Feedback**: Clear confirmation when merges complete successfully

### ✅ **User Experience**
- **Modal Interface**: Clean, focused UI for batch selection
- **Grouped Display**: Batches grouped by brand/set/year for easy identification
- **Real-time Validation**: Immediate feedback on incompatible selections
- **Loading States**: Clear progress indication during merge operations
- **Responsive Design**: Works on all screen sizes

## Files Modified

### 1. **Types** (`src/types/imports.ts`)
```typescript
// Added batch merging types
export interface MergeBatchesRequest {
  batch_ids: number[]      // Array of batch IDs to merge (minimum 2)
  new_batch_name: string   // Name for the new merged batch
}

export interface MergeBatchesResponse {
  new_batch_id: number
  new_batch_name: string
  merged_batches: number
  total_rows: number
  source_batch_ids: number[]
  brand: string
  set_name: string
  year: number
  sport: string
}
```

### 2. **Service** (`src/services/imports.ts`)
```typescript
// Added mergeBatches function
async mergeBatches(request: MergeBatchesRequest): Promise<MergeBatchesResponse> {
  const res = await apiRequest(`${API_BASE_URL}/admin/imports/merge-batches`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Merge batches failed')
  }
  return res.json()
}
```

### 3. **BatchMerger Component** (`src/components/BatchMerger.tsx`)
New component that provides:
- **Batch Selection Interface**: Checkboxes for selecting batches to merge
- **Validation Logic**: Real-time validation of selection compatibility
- **Form Input**: Text field for naming the merged batch
- **Error Display**: User-friendly error messages
- **Grouped Layout**: Batches organized by brand/set/year

### 4. **PendingBatchesPage** (`src/pages/PendingBatchesPage.tsx`)
Enhanced with:
- **Merge Button**: Prominent button to access merge functionality
- **State Management**: Handles merge modal visibility and success messages
- **Success Feedback**: Displays confirmation when merges complete
- **Integration**: Seamlessly integrates with existing delete functionality

## API Integration

The frontend integrates with the backend API endpoint:

**Endpoint**: `POST /admin/imports/merge-batches`

**Request Body**:
```json
{
  "batch_ids": [123, 456, 789],
  "new_batch_name": "2023 Topps Series 1 - Complete Set"
}
```

**Response**:
```json
{
  "new_batch_id": 999,
  "new_batch_name": "2023 Topps Series 1 - Complete Set",
  "merged_batches": 3,
  "total_rows": 450,
  "source_batch_ids": [123, 456, 789],
  "brand": "Topps",
  "set_name": "2023 Series 1",
  "year": 2023,
  "sport": "Baseball"
}
```

## User Workflow

1. **Navigate** to the Pending Batches page (`/admin/imports/pending`)
2. **Click** the "Merge Batches" button (visible when batches exist)
3. **Select** 2 or more compatible batches using checkboxes
4. **Enter** a descriptive name for the merged batch
5. **Click** "Merge X Batches" to execute the merge
6. **Confirm** success and see the new merged batch in the list

## Validation Rules

### ✅ **Required Conditions**
- **Minimum 2 batches**: At least 2 batch IDs must be selected
- **Compatible metadata**: All selected batches must have identical:
  - Brand (e.g., "Topps")
  - Set name (e.g., "2023 Series 1") 
  - Year (e.g., 2023)
  - Sport (e.g., "Baseball")
- **Valid name**: Merged batch name cannot be empty

### ❌ **Blocking Conditions**
- **Committed batches**: Cannot merge batches that are already committed
- **Metadata mismatch**: Real-time validation prevents incompatible selections

## Error Handling

The implementation includes comprehensive error handling:

### **Frontend Validation**
- Empty batch name validation
- Minimum batch count validation
- Metadata compatibility checking
- Real-time UI feedback

### **API Error Handling**
```typescript
try {
  const result = await importService.mergeBatches(request)
  // Success handling...
} catch (error) {
  // Display user-friendly error message
  setError(error.message || 'Merge failed')
}
```

### **Common Error Messages**
- "Please select at least 2 batches to merge"
- "Please enter a name for the merged batch"
- "Selected batches must have the same brand, set name, year, and sport"
- "Cannot merge batch X because it has already been committed to the database"

## UI Components

### **Merge Button**
- Prominently displayed on Pending Batches page
- Green gradient styling to indicate positive action
- Only shown when batches are available
- Hover effects for better interaction feedback

### **Modal Interface**
- Overlay design prevents outside interaction
- Scrollable content for many batches
- Responsive layout adapts to screen size
- Click-outside-to-close functionality

### **Batch Selection**
- Grouped by brand/set/year for clarity
- Disabled checkboxes for committed batches
- Visual indicators for selection status
- Batch details (rows, unresolved count) clearly shown

### **Success Feedback**
- Green success banner with detailed information
- Auto-dismisses after 8 seconds
- Links to view pending batches
- Clear confirmation of what was merged

## Benefits for Users

- **Simplified Organization**: Keep related imports together
- **Better Workflow**: Fix accidental splits without re-importing
- **Cleaner Interface**: Fewer batches to manage in the list
- **Data Integrity**: Preserve all import data and metadata
- **Audit Trail**: New batch shows merge source information

## Testing Scenarios

### **Happy Path**
1. ✅ Select 2+ compatible batches (same metadata, not committed)
2. ✅ Enter a descriptive name
3. ✅ Confirm merge successfully creates new batch
4. ✅ Verify source batches are removed from list
5. ✅ Verify success message displays correctly

### **Error Cases**
1. ✅ Try to merge only 1 batch → Shows validation error
2. ✅ Try to merge batches with different metadata → Shows compatibility error
3. ✅ Submit empty batch name → Shows name required error
4. ✅ API errors → Shows user-friendly error messages

### **Edge Cases**
1. ✅ Modal closes when clicking outside
2. ✅ Form resets after successful merge
3. ✅ Loading states prevent double-submission
4. ✅ Success message auto-dismisses

## Development Notes

### **State Management**
- Uses React Query for server state management
- Local component state for form data and UI state
- Automatic cache invalidation after successful merges

### **TypeScript Integration**
- Fully typed interfaces for all API requests/responses
- Type-safe component props and state
- IntelliSense support for all merge-related code

### **Styling**
- Leverages existing CSS variables and classes
- Consistent with application design system
- Responsive design patterns maintained

## Future Enhancements

While not currently implemented, the architecture supports these potential improvements:

- **Bulk Operations**: Select and merge multiple groups at once
- **Preview Mode**: Show combined data before confirming merge
- **Batch History**: Track merge operations and source information
- **Advanced Filtering**: Filter batches by various criteria before merging
- **Merge Templates**: Save commonly used merge configurations

## Conclusion

The batch merging feature successfully integrates into the existing card inventory system, providing users with a powerful tool for organizing their import data. The implementation follows best practices for React/TypeScript development and maintains consistency with the existing codebase architecture.

The feature is production-ready and provides a seamless user experience for combining related import batches into unified collections.
