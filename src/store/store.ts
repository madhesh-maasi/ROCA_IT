import { configureStore } from "@reduxjs/toolkit";
import { incomeTaxReducer, userReducer } from "./slices";
import employeeReducer from "./slices/employeeSlice";

/**
 * Central Redux store for the ROCA_IT solution.
 * Add new feature reducers here as the solution grows.
 */
export const store = configureStore({
  reducer: {
    incomeTax: incomeTaxReducer,
    user: userReducer,
    employee: employeeReducer,
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
