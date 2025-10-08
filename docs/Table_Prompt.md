# Advanced Data Table Implementation Guide

Create a comprehensive shadcn data table with advanced features for managing any dataset. This table provides full CRUD operations, multi-select functionality, and dynamic pagination.

## Core Architecture

- **Data Management**: Use `useQuery` from react-query to populate table data
- **State Management**: Zustand stores for table state (pagination, sorting, selection, search)
- **Actions**: Server actions with Prisma queries for all data operations
- **Hooks**: Custom hooks for debounced search, bulk operations, and data fetching

## Essential Features

### 1. Search & Filtering

- Search bar at top-left filtering across multiple string columns
- Debounced search input (separate state for immediate UI updates)
- Real-time filtering applied to server queries

### 2. Column Sorting

- Clickable column headers with three-state sorting: ascending → descending → none
- Visual indicators: ChevronUp (asc), ChevronDown (desc), opacity-0 (none)
- Server-side sorting implementation

### 3. Dynamic Pagination

- **Viewport-based pagination**: Calculate items per page based on available height
- Fixed row height constant (e.g., `ROW_HEIGHT = 60`)
- `itemsPerPage = Math.floor(availableHeight / ROW_HEIGHT)`
- ResizeObserver for responsive recalculation
- Bottom pagination controls with page navigation

### 4. Multi-Select System

- Header checkbox with three states: none, some, all selected
- Individual row checkboxes
- Selected items tracked in Set for O(1) operations
- Selection persistence across page changes

### 5. Bulk Operations

- Bulk edit popover triggered when items selected
- Toggle switches for bulk status updates
- Action buttons for bulk operations (generate, delete, etc.)
- Loading states during bulk operations

### 6. Row Interactions

- **Row Click Navigation**: Navigate to detail view (`router.push`)
- **Toggle Switches**: Individual row actions (status, categories, etc.)
- **Action Buttons**: Row-specific operations (preview, edit, etc.)
- Click event propagation management (`e.stopPropagation()`)

### 7. File Upload Integration

- **Drag & Drop Overlay**: Full-screen drop zone with visual feedback
- File type validation and processing
- Upload progress indicators
- Results display with success/error feedback
- Automatic table refresh after upload

### 8. Advanced Loading States

- **Skeleton Loading**: Maintain table structure during fetch
- **Pulse Animation**: Gray placeholder divs with `animate-pulse`
- **Selective Opacity**: Hide content (`opacity-0`) while showing structure
- **Stale-While-Revalidate**: Show previous data during refetch

### 9. Responsive Design

- **Mobile-first approach** with responsive breakpoints
- **Flexible layouts**: Search bar and controls adapt to screen size
- **Touch-friendly**: Appropriate button sizes and spacing
- **Overflow handling**: Horizontal scroll for wide tables

## Implementation Details

### State Management Pattern

```typescript
// Table store with pagination, sorting, search, selection
const useTableStore = create((set) => ({
  search: "",
  sort: { column: "", direction: null },
  page: 0,
  itemsPerPage: 10,
  selectedItems: new Set(),
  // ... actions
}));
```

### Dynamic Pagination Logic

- Container height detection via refs
- Header height calculation
- Available space computation
- Items per page recalculation on resize
- Fallback handling for ResizeObserver compatibility

### Multi-Select Implementation

- Set-based selection tracking
- Header checkbox indeterminate state
- Bulk operation state management
- Selection clearing after operations

### File Upload Handling

- Document-level drag event listeners
- File type validation
- Upload mutation with progress tracking
- Results parsing and display
- Error handling and user feedback

### Loading State Strategy

- Maintain UI structure during loading
- Absolute positioned skeleton elements
- Content opacity management
- Smooth transitions between states

## Required Dependencies

- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `lucide-react` - Icons
- `@radix-ui/react-*` - UI primitives (popover, checkbox, switch)
- Custom debounce utility or `use-debounce`

## File Organization

- `page.tsx` - Main table component
- `page.hooks.tsx` - Custom hooks (search, mutations, data fetching)
- `page.stores.tsx` - Zustand stores (table, upload, modal states)
- `page.actions.ts` - Server actions
- `page.types.ts` - TypeScript interfaces

This pattern creates a highly interactive, performant data table suitable for any dataset with full CRUD operations and professional UX.
