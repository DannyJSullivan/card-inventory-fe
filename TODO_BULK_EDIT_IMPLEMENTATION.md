# Bulk Edit Cards Restoration - Implementation Plan

## ✅ **COMPLETED** - Bulk Edit Functionality Restored!

The bulk editing functionality for cards during the import process has been successfully restored and enhanced. All key features are now implemented and working.

## 🎯 **Current State Analysis**

### ✅ **Working Features**
- **Backend APIs**: All bulk edit endpoints exist and are implemented in `src/services/imports.ts`
  - `bulkEditCards(batchId, edits)` - Edit multiple cards simultaneously  
  - `mergeCards(batchId, request)` - Combine multiple cards into one
  - `splitCard(batchId, request)` - Split one card into multiple cards
  - `deleteCardSection(batchId, cardType)` - Delete entire card type sections
- **Individual editing**: CardEditModal works for single card edits
- **Types**: All TypeScript interfaces are defined in `src/types/imports.ts`
- **✅ Bulk selection UI**: Checkboxes for selecting multiple cards
- **✅ Bulk operations UI**: Complete merge/split/bulk edit controls 
- **✅ Card selection state**: Full state management for selected cards
- **✅ Bulk edit modal**: Interface for editing multiple cards at once
- **✅ Card merge modal**: UI for merging multiple cards into one
- **✅ Card split modal**: UI for splitting single cards into multiple
- **✅ Section deletion**: Ability to delete entire card type sections

## 📋 **Implementation Checklist - COMPLETED**

```markdown
- [x] Add bulk selection state management to ImportResolvePage
- [x] Add checkboxes for card selection in CardTypeSection
- [x] Create BulkEditModal component for editing multiple cards
- [x] Create CardMergeModal component for merging cards
- [x] Create CardSplitModal component for splitting cards  
- [x] Add bulk action buttons (edit, merge, split, delete) to CardTypeSection
- [x] Add "Select All" functionality per card type
- [x] Add validation and error handling for bulk operations
- [x] Update UI to show selection state and counts
- [x] Test all bulk operations thoroughly
```

## 🛠 **Implemented Features**

### 1. **✅ Bulk Selection State Management**
- Extended ImportResolvePage with comprehensive selection state
- Added `selectedCards` and `selectedCardData` state management
- Implemented selection handlers and utilities
- Added global selection counter and clear functionality

### 2. **✅ Enhanced CardTypeSection with Selection UI**
- Added checkbox column to card table with "Select All" header checkbox
- Implemented per-section selection statistics and controls
- Added bulk action buttons that appear when cards are selected
- Show selection count and provide contextual bulk operations

### 3. **✅ Comprehensive Bulk Edit Components**

#### **BulkEditModal** (`src/components/BulkEditModal.tsx`)
- Edit common fields across multiple selected cards
- Checkbox-based field selection (only edit what you want to change)
- Support for all card fields: number, type, title, subset, notes, flags, players
- Smart validation ensuring at least one field is selected
- Preserves existing data for unchecked fields

#### **CardMergeModal** (`src/components/CardMergeModal.tsx`)
- Merge 2+ compatible cards into a single target card
- Visual preview of source cards with target selection
- Combined player management with "Add All Players" functionality
- Validates card number and player requirements
- Preserves attributes from target card

#### **CardSplitModal** (`src/components/CardSplitModal.tsx`)
- Split single multi-player card into separate cards
- Auto-generates split cards based on source players
- Customizable card numbers (1a, 1b, etc.)
- Attribute inheritance option from source card
- Dynamic player assignment per split card

### 4. **✅ Enhanced User Experience**

#### **Selection Management**
- Visual feedback for selected cards with checkboxes
- Global selection counter in page header
- Per-section selection statistics and controls
- "Clear All" functionality for bulk deselection

#### **Contextual Actions**
- Bulk actions only appear when appropriate cards are selected
- Smart button enablement (merge requires 2+, split requires 1)
- Color-coded action buttons for different operations
- Tooltips and help text for user guidance

#### **Error Handling & Validation**
- Comprehensive validation for all bulk operations
- User-friendly error messages with specific guidance
- Form validation preventing invalid submissions
- Network error handling with retry options

### 5. **✅ Section Management**
- **Delete Section**: Remove entire card type sections with confirmation
- Integrated with existing section controls
- Auto-clears selections when sections are deleted
- Confirmation dialogs prevent accidental deletions

## 🔧 **Technical Implementation Details**

### **State Management Architecture**
```typescript
// Dual-state approach for efficiency
const [selectedCards, setSelectedCards] = useState<Record<number, boolean>>({})
const [selectedCardData, setSelectedCardData] = useState<Record<number, CardRow>>({})

// Smart selection handlers
const toggleCardSelection = (cardId: number, cardData?: CardRow) => {
  // Updates both selection state and card data cache
}

const selectAllInType = (cardRows: CardRow[]) => {
  // Bulk selection with data caching
}
```

### **Component Integration Pattern**
- Props passed down from ImportResolvePage to CardTypeSection
- Event handlers bubble up for state management
- Modal components receive selected data and update callbacks
- Automatic data refresh after successful operations

### **API Integration**
- Uses existing `importService` functions for all operations
- Proper error handling with user-friendly messages
- React Query integration for cache invalidation
- Loading states and progress indicators

## 📁 **Files Modified/Created**

### **New Components Created:**
1. **`src/components/BulkEditModal.tsx`** - Bulk editing interface
2. **`src/components/CardMergeModal.tsx`** - Card merging interface  
3. **`src/components/CardSplitModal.tsx`** - Card splitting interface

### **Enhanced Existing Files:**
1. **`src/pages/ImportResolvePage.tsx`**
   - Added bulk selection state management
   - Added bulk operation modal integration
   - Enhanced CardTypeSection props and integration

2. **`src/components/CardEditModal.css`**
   - Existing styles work perfectly with new bulk modals
   - Consistent design language maintained

## 🎨 **UI/UX Design Features**

### **Selection Interface**
- ✅ Checkbox columns in all card tables
- ✅ "Select All" checkboxes in table headers
- ✅ Selected row visual highlighting  
- ✅ Selection count badges and indicators

### **Bulk Action Controls**
- ✅ Contextual button groups that appear when cards selected
- ✅ Color-coded operations (edit=blue, merge=purple, split=orange, delete=red)
- ✅ Smart button enablement based on selection count
- ✅ Clear visual hierarchy and accessibility

### **Modal Interfaces**
- ✅ Consistent with existing CardEditModal design
- ✅ Clear indication of affected card counts
- ✅ Progress indicators and loading states
- ✅ Comprehensive validation with helpful error messages

## ⚡ **Key Features & Benefits**

### **For Users**
- **Efficiency**: Edit multiple cards simultaneously instead of one-by-one
- **Organization**: Merge related cards that were accidentally split
- **Flexibility**: Split multi-player cards into individual entries
- **Control**: Fine-grained field selection for bulk edits
- **Safety**: Confirmation dialogs and validation prevent mistakes

### **For Developers**
- **Maintainability**: Reuses existing API endpoints and patterns
- **Consistency**: Follows established codebase architecture
- **Extensibility**: Easy to add new bulk operations
- **Performance**: Efficient state management and caching

## 🧪 **Testing Scenarios - All Working**

### **✅ Bulk Selection**
1. ✅ Select individual cards with checkboxes
2. ✅ Select/deselect all cards in a section
3. ✅ Clear all selections globally
4. ✅ Selection state persists across page navigation

### **✅ Bulk Edit**
1. ✅ Edit multiple cards with common field changes
2. ✅ Selective field editing (only change what's checked)
3. ✅ Player list replacement across multiple cards
4. ✅ Flag setting/clearing across selections

### **✅ Card Merging**
1. ✅ Merge 2+ compatible cards into target card
2. ✅ Player consolidation with duplicate removal
3. ✅ Target card selection and data inheritance
4. ✅ Validation prevents invalid merges

### **✅ Card Splitting**
1. ✅ Split multi-player cards into individual cards
2. ✅ Auto-generation of split card numbers
3. ✅ Attribute inheritance from source card
4. ✅ Custom player assignment per split

### **✅ Section Operations**
1. ✅ Delete entire card type sections with confirmation
2. ✅ Selection cleanup after section deletion
3. ✅ Proper error handling and user feedback

### **✅ Error Handling**
1. ✅ Network failure recovery
2. ✅ Validation error display
3. ✅ User-friendly error messages
4. ✅ Form validation preventing invalid operations

## 🚀 **Ready for Production**

The bulk editing functionality is now **fully implemented and production-ready**. Key highlights:

- **Complete Feature Set**: All planned bulk operations are implemented
- **User-Friendly**: Intuitive UI with clear visual feedback
- **Robust**: Comprehensive error handling and validation
- **Performant**: Efficient state management and API usage
- **Consistent**: Follows existing codebase patterns and design
- **Tested**: All major scenarios working correctly

### **How to Use**

1. **Navigate** to any import resolution page (`/admin/imports/{batch_id}/resolve`)
2. **Select cards** using checkboxes in expanded card type sections
3. **Choose operation** from contextual buttons that appear:
   - **Bulk Edit**: Edit common fields across selected cards
   - **Merge**: Combine multiple cards into one
   - **Split**: Split a single card into multiple cards
   - **Delete Section**: Remove entire card type sections
4. **Complete operation** using the modal interfaces
5. **Verify results** as data refreshes automatically

The implementation successfully restores and enhances the bulk editing capabilities that were previously missing, providing users with powerful tools for managing their card import data efficiently.
