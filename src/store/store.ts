import { configureStore } from '@reduxjs/toolkit';
import { incomeTaxReducer } from './slices';

/**
 * Central Redux store for the ROCA_IT solution.
 * Add new feature reducers here as the solution grows.
 */
export const store = configureStore({
    reducer: {
        incomeTax: incomeTaxReducer,
        // Add more slices here as new features are added:
        // employees: employeesReducer,
        // departments: departmentsReducer,
    },
});

/**
 * Inferred type for the full Redux state tree.
 * Use this in typed selectors: `(state: RootState) => state.incomeTax.items`
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Inferred type for the store's dispatch function.
 * Use this with `useAppDispatch()` to get async thunk support.
 */
export type AppDispatch = typeof store.dispatch;
