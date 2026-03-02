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
} from "./incomeTaxSlice";

export type { IIncomeTaxState } from "./incomeTaxSlice";

export {
  default as userReducer,
  fetchUserContext,
  setRole,
  resetUserState as resetUser,
  selectUserRole,
  selectUserDetails,
  selectUserLoading,
  selectUserError,
} from "./userSlice";

export type { IUserState } from "./userSlice";
export {
  default as employeeReducer,
  fetchEmployeeMaster,
  fetchSiteMembers,
  clearEmployees,
  selectEmployees,
  selectSiteMembers,
  selectEmployeesLoading,
  selectMembersLoading,
  selectEmployeesError,
} from "./employeeSlice";

export type { IEmployeeState } from "./employeeSlice";
