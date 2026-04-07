import * as React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppRole } from "../../../../common/models";
import AppHeader from "../AppHeader/AppHeader";
import SideNav from "../SideNav/SideNav";
import SubmittedDeclarations from "../screens/SubmittedDeclarations/SubmittedDeclarations";
import EmployeeDeclarations from "../screens/EmployeeDeclarations/EmployeeDeclarations";
import FinanceApprover from "../screens/FinanceApprover/FinanceApprover";
import ITCalculator from "../screens/ITCalculator/ITCalculator";
import SectionConfig from "../screens/SectionConfig/SectionConfig";
import LookupConfig from "../screens/LookupConfig/LookupConfig";
import ReleaseDeclaration from "../screens/ReleaseDeclaration/ReleaseDeclaration";
import ReleaseExtension from "../screens/ReleaseExtension/ReleaseExtension";
import ExportDeclaration from "../screens/ExportDeclaration/ExportDeclaration";
import TaxRegimeUpdate from "../screens/TaxRegimeUpdate/TaxRegimeUpdate";
import ITCalculatorUpload from "../screens/ITCalculatorUpload/ITCalculatorUpload";
import ITDeclaration from "../screens/ITDeclaration/ITDeclaration";
import ActualITDeclaration from "../screens/ActualITDeclaration/ITDeclaration";
import DeclarationFormScreen from "../screens/DeclarationForm/DeclarationFormScreen";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { fetchIncomeTaxItems } from "../../../../store/slices/incomeTaxSlice";
import { selectUserDetails } from "../../../../store/slices/userSlice";
import { getListItems } from "../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../common/constants/appConstants";
import { ProtectedRoute } from "../../../../common/components";
import styles from "./Dashboard.module.scss";
import { curFinanicalYear } from "../../../../common/utils/functions";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface IDashboardProps {
  role: AppRole;
  userDisplayName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard: React.FC<IDashboardProps> = ({ role }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const activeScreen = React.useMemo(() => {
    const path = location.pathname.replace(/^\//, "");
    if (path === "itDeclaration" || path === "actualItDeclaration") {
      return location.state?.from || "submittedDeclarations";
    }
    const defaultScreen =
      role === "FinanceApprover"
        ? "employeeDeclaration"
        : "submittedDeclarations";
    return path || defaultScreen;
  }, [location, role]);

  const user = useAppSelector(selectUserDetails);

  React.useEffect(() => {
    if (!user) return;

    // Fetch income tax items on dashboard load to populate sidebar triggers
    void dispatch(
      fetchIncomeTaxItems({
        getItems: () => {
          if (role === "Admin" || role === "FinanceApprover") {
            return getListItems(
              LIST_NAMES.PLANNED_DECLARATION,
              `FinancialYear eq '${curFinanicalYear}'`,
            );
          } else {
            const filterStr = `EmployeeEmail eq '${user.Email}' and FinancialYear eq '${curFinanicalYear}'`;
            return getListItems(LIST_NAMES.PLANNED_DECLARATION, filterStr);
          }
        },
      }),
    );
  }, [dispatch, role, user]);

  const renderDashboardContent = (): React.ReactElement => {
    return (
      <Routes>
        {/* Root redirect — no access check needed */}
        <Route
          path="/"
          element={
            <Navigate
              to={
                role === "FinanceApprover"
                  ? "/employeeDeclaration"
                  : "/submittedDeclarations"
              }
              replace
            />
          }
        />

        {/* Open to all roles (no allowedRoles in NAV_CONFIG) */}
        <Route
          path="/submittedDeclarations"
          element={
            <ProtectedRoute role={role}>
              <SubmittedDeclarations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itCalculator"
          element={
            <ProtectedRoute role={role}>
              <ITCalculator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itDeclaration"
          element={
            <ProtectedRoute role={role}>
              <ITDeclaration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actualItDeclaration"
          element={
            <ProtectedRoute role={role}>
              <ActualITDeclaration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/declarationForm/:id"
          element={
            <ProtectedRoute role={role}>
              <DeclarationFormScreen />
            </ProtectedRoute>
          }
        />

        {/* Administration routes — role-gated via NAV_CONFIG allowedRoles */}
        <Route
          path="/employeeDeclaration"
          element={
            <ProtectedRoute role={role}>
              <EmployeeDeclarations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeApprover"
          element={
            <ProtectedRoute role={role}>
              <FinanceApprover />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sectionConfig"
          element={
            <ProtectedRoute role={role}>
              <SectionConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lookupConfig"
          element={
            <ProtectedRoute role={role}>
              <LookupConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/releaseDeclaration"
          element={
            <ProtectedRoute role={role}>
              <ReleaseDeclaration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/extendSubmission"
          element={
            <ProtectedRoute role={role}>
              <ReleaseExtension />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exportDeclaration"
          element={
            <ProtectedRoute role={role}>
              <ExportDeclaration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taxRegimeUpdate"
          element={
            <ProtectedRoute role={role}>
              <TaxRegimeUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itCalculatorUpload"
          element={
            <ProtectedRoute role={role}>
              <ITCalculatorUpload />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect to default screen */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                role === "FinanceApprover"
                  ? "/employeeDeclaration"
                  : "/submittedDeclarations"
              }
              replace
            />
          }
        />
      </Routes>
    );
  };

  return (
    <div className={styles.dashboard}>
      <AppHeader />
      <div className={styles.body}>
        <SideNav role={role} activeKey={activeScreen} />
        <main className={styles.content} id="mainContent">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
