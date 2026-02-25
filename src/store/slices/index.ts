export {
    default as incomeTaxReducer,
    fetchIncomeTaxItems,
    setSelectedItem,
    clearError,
    resetState,
    selectIncomeTaxItems,
    selectSelectedItem,
    selectIsLoading,
    selectError,
} from './incomeTaxSlice';

export type { IIncomeTaxState } from './incomeTaxSlice';
