import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  ICurrentUser,
  getCurrentUser,
  getCurrentUserGroups,
  getSiteOwnersGroup,
} from "../../common/utils/pnpService";
import { AppRole } from "../../common/models";
import { handleError } from "../../common/utils/errorUtils";

export interface IUserState {
  details: ICurrentUser | undefined;
  role: AppRole;
  isLoading: boolean;
  error: string | undefined;
}

const initialState: IUserState = {
  details: undefined,
  role: "User", // default
  isLoading: false,
  error: undefined,
};

export const fetchUserContext = createAsyncThunk<
  { details: ICurrentUser; role: AppRole },
  void
>("user/fetchContext", async (_, { rejectWithValue }) => {
  try {
    // 1. Fetch the user profile
    const details = await getCurrentUser();

    // 2. Fetch the groups the user belongs to
    const userGroups = await getCurrentUserGroups();

    // 3. Fetch the site owners group
    const siteOwners = await getSiteOwnersGroup();

    let role: AppRole = "User";

    // 4. Role determination logic
    const isSiteOwner = userGroups.some((g: any) => g.Id === siteOwners.Id);
    if (isSiteOwner) {
      role = "Admin";
    } else {
      const isFinanceApprover = userGroups.some(
        (g: any) => g.Title === "Admins",
      );
      if (isFinanceApprover) {
        role = "FinanceApprover";
      }
    }

    return { details, role };
  } catch (error) {
    await handleError(error, "Fetching user context");
    const message =
      error instanceof Error ? error.message : "Failed to fetch user context";
    return rejectWithValue(message);
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<AppRole>) {
      state.role = action.payload;
    },
    resetUserState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserContext.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchUserContext.fulfilled, (state, action) => {
        state.isLoading = false;
        state.details = action.payload.details;
        state.role = action.payload.role;
      })
      .addCase(fetchUserContext.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setRole, resetUserState } = userSlice.actions;

export const selectUserRole = (state: { user: IUserState }): AppRole =>
  state.user.role;
export const selectUserDetails = (state: {
  user: IUserState;
}): ICurrentUser | undefined => state.user.details;
export const selectUserLoading = (state: { user: IUserState }): boolean =>
  state.user.isLoading;
export const selectUserError = (state: {
  user: IUserState;
}): string | undefined => state.user.error;

export default userSlice.reducer;
