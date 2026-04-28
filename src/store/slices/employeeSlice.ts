import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getEmployeeMasterUsers,
  getGroupUsersByName,
} from "../../common/utils/pnpService";
import { IEmployee } from "../../common/models";
import { handleError } from "../../common/utils/errorUtils";

export interface IEmployeeState {
  employees: IEmployee[];
  siteMembers: IEmployee[];
  isLoading: boolean;
  isMembersLoading: boolean;
  error: string | undefined;
}

const initialState: IEmployeeState = {
  employees: [],
  siteMembers: [],
  isLoading: false,
  isMembersLoading: false,
  error: undefined,
};

export const fetchEmployeeMaster = createAsyncThunk<
  IEmployee[],
  string | undefined
>("employee/fetchEmployeeMaster", async (siteUrl, { rejectWithValue }) => {
  try {
    const raw = await getEmployeeMasterUsers(siteUrl ?? "");
    const data: IEmployee[] = raw.map((item: any) => ({
      Id: item.Id,
      Title: item.Title ?? "",
      Name: item.Name || item.EmployeeName || item.Title || "",
      PAN: item.PANNumber ?? "",
      EmployeeId: item.EmployeeId ?? "",
      DOB: item.DateOfBirth ?? "",
      PhoneNo: item.EmployeeMobile ?? "",
      Email: item.EmployeeEmail ? item.EmployeeEmail : "",
      Department: item.Department ?? "",
      Designation: item.Designation ?? "",
      Location: item.Location.Title ?? "",
      DOJ: item.DateOfJoining ? item.DateOfJoining : "",
      IsActive: item.IsActive,
    }));

    return data;
  } catch (error) {
    await handleError(error, "Fetching master employees");
    const message =
      error instanceof Error ? error.message : "Failed to fetch employees";
    return rejectWithValue(message);
  }
});

export const fetchSiteMembers = createAsyncThunk<IEmployee[]>(
  "employee/fetchSiteMembers",
  async (_, { rejectWithValue }) => {
    try {
      const raw = await getGroupUsersByName("Members");
      const data: IEmployee[] = raw.map((item: any) => ({
        Id: item.Id,
        Title: item.Title ?? "",
        Name: item.Title ?? "",
        PAN: "",
        EmployeeId: "",
        DOB: "",
        PhoneNo: "",
        Email: item.Email ?? "",
        Department: "",
        Designation: "",
        Location: "",
        DOJ: "",
      }));
      return data;
    } catch (error) {
      await handleError(error, "Fetching site members");
      const message =
        error instanceof Error ? error.message : "Failed to fetch site members";
      return rejectWithValue(message);
    }
  },
);

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    clearEmployees(state) {
      state.employees = [];
      state.siteMembers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeMaster.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchEmployeeMaster.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployeeMaster.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSiteMembers.pending, (state) => {
        state.isMembersLoading = true;
      })
      .addCase(fetchSiteMembers.fulfilled, (state, action) => {
        state.isMembersLoading = false;
        state.siteMembers = action.payload;
      })
      .addCase(fetchSiteMembers.rejected, (state) => {
        state.isMembersLoading = false;
      });
  },
});

export const { clearEmployees } = employeeSlice.actions;

export const selectEmployees = (state: {
  employee: IEmployeeState;
}): IEmployee[] => state.employee.employees;

export const selectSiteMembers = (state: {
  employee: IEmployeeState;
}): IEmployee[] => state.employee.siteMembers;

export const selectEmployeesLoading = (state: {
  employee: IEmployeeState;
}): boolean => state.employee.isLoading;

export const selectMembersLoading = (state: {
  employee: IEmployeeState;
}): boolean => state.employee.isMembersLoading;

export const selectEmployeesError = (state: {
  employee: IEmployeeState;
}): string | undefined => state.employee.error;

export default employeeSlice.reducer;
