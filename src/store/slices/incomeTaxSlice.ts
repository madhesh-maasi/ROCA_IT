import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { IIncomeTaxItem } from "../../common/models";
import { handleError } from "../../common/utils/errorUtils";

/**
 * State shape for the IncomeTax feature slice.
 */
export interface IIncomeTaxState {
  items: IIncomeTaxItem[];
  actualItems: IIncomeTaxItem[];
  selectedItem: IIncomeTaxItem | undefined;
  isLoading: boolean;
  actualIsLoading: boolean;
  error: string | undefined;
}

const initialState: IIncomeTaxState = {
  items: [],
  actualItems: [],
  selectedItem: undefined,
  isLoading: false,
  actualIsLoading: false,
  error: undefined,
};

/**
 * Async thunk for fetching income tax items.
 * The actual service call is injected via thunkAPI.extra or passed as argument.
 *
 * @example
 * // Dispatch from a component:
 * dispatch(fetchIncomeTaxItems(incomeTaxService));
 */
export const fetchIncomeTaxItems = createAsyncThunk<
  IIncomeTaxItem[],
  { getItems: () => Promise<IIncomeTaxItem[]> }
>("incomeTax/fetchItems", async ({ getItems }, { rejectWithValue }) => {
  try {
    const items = await getItems();
    return items;
  } catch (error) {
    await handleError(error, "Fetching income tax items");
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch income tax items";
    return rejectWithValue(message);
  }
});

export const fetchActualIncomeTaxItems = createAsyncThunk<
  IIncomeTaxItem[],
  { getItems: () => Promise<IIncomeTaxItem[]> }
>("incomeTax/fetchActualItems", async ({ getItems }, { rejectWithValue }) => {
  try {
    const items = await getItems();
    return items;
  } catch (error) {
    await handleError(error, "Fetching actual income tax items");
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch actual income tax items";
    return rejectWithValue(message);
  }
});

/**
 * Redux slice for Income Tax state management.
 * Contains synchronous reducers and handles async thunk lifecycle.
 */
const incomeTaxSlice = createSlice({
  name: "incomeTax",
  initialState,
  reducers: {
    setSelectedItem(state, action: PayloadAction<IIncomeTaxItem | undefined>) {
      state.selectedItem = action.payload;
    },
    clearError(state) {
      state.error = undefined;
    },
    resetState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomeTaxItems.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchIncomeTaxItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchIncomeTaxItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchActualIncomeTaxItems.pending, (state) => {
        state.actualIsLoading = true;
        state.error = undefined;
      })
      .addCase(fetchActualIncomeTaxItems.fulfilled, (state, action) => {
        state.actualIsLoading = false;
        state.actualItems = action.payload;
      })
      .addCase(fetchActualIncomeTaxItems.rejected, (state, action) => {
        state.actualIsLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions for use in components
export const { setSelectedItem, clearError, resetState } =
  incomeTaxSlice.actions;

// Export selectors for use with useAppSelector
export const selectIncomeTaxItems = (state: {
  incomeTax: IIncomeTaxState;
}): IIncomeTaxItem[] => state.incomeTax.items;
export const selectActualIncomeTaxItems = (state: {
  incomeTax: IIncomeTaxState;
}): IIncomeTaxItem[] => state.incomeTax.actualItems;
export const selectSelectedItem = (state: {
  incomeTax: IIncomeTaxState;
}): IIncomeTaxItem | undefined => state.incomeTax.selectedItem;
export const selectIsLoading = (state: {
  incomeTax: IIncomeTaxState;
}): boolean => state.incomeTax.isLoading;
export const selectError = (state: {
  incomeTax: IIncomeTaxState;
}): string | undefined => state.incomeTax.error;

export default incomeTaxSlice.reducer;
