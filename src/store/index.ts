// Store
export { store } from './store';
export type { RootState, AppDispatch } from './store';

// Typed hooks
export { useAppDispatch, useAppSelector } from './hooks';

// Slices - re-export everything for convenience
export {
    incomeTaxReducer,
    fetchIncomeTaxItems,
    setSelectedItem,
    clearError,
    resetState,
    selectIncomeTaxItems,
    selectSelectedItem,
    selectIsLoading,
    selectError,
} from './slices';
export type { IIncomeTaxState } from './slices';
