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
import PlaceholderScreen from "../screens/PlaceholderScreen/PlaceholderScreen";
import { useAppDispatch } from "../../../../store/hooks";
import { fetchIncomeTaxItems } from "../../../../store/slices/incomeTaxSlice";
import { getListItems } from "../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../common/constants/appConstants";
import styles from "./Dashboard.module.scss";

// ─── Screen → Component map ───────────────────────────────────────────────────

const PLACEHOLDER_SCREENS: Record<string, string> = {
  itCalculator: "IT Calculator",
  sectionConfig: "Section Config",
  lookupConfig: "Lookup Config",
  releaseDeclaration: "Release Declaration",
  extendSubmission: "Extend Submission",
  exportDeclaration: "Export Declaration",
  taxRegimeUpdate: "Tax Regime Update",
  itCalculatorUpload: "IT Calculator Upload",
  financeApprover: "Finance Approver",
};

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
    return path || "submittedDeclarations";
  }, [location]);

  React.useEffect(() => {
    // Fetch income tax items on dashboard load to populate sidebar triggers
    void dispatch(
      fetchIncomeTaxItems({
        getItems: () => getListItems(LIST_NAMES.INCOME_TAX),
      }),
    );
  }, [dispatch]);

  const renderDashboardContent = (): React.ReactElement => {
    return (
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/submittedDeclarations" replace />}
        />
        <Route
          path="/submittedDeclarations"
          element={<SubmittedDeclarations />}
        />
        <Route path="/employeeDeclaration" element={<EmployeeDeclarations />} />
        <Route path="/itCalculator" element={<ITCalculator />} />
        <Route path="/financeApprover" element={<FinanceApprover />} />
        <Route path="/sectionConfig" element={<SectionConfig />} />
        <Route path="/lookupConfig" element={<LookupConfig />} />
        <Route path="/releaseDeclaration" element={<ReleaseDeclaration />} />
        <Route path="/extendSubmission" element={<ReleaseExtension />} />
        <Route path="/exportDeclaration" element={<ExportDeclaration />} />
        <Route path="/taxRegimeUpdate" element={<TaxRegimeUpdate />} />
        <Route path="/itCalculatorUpload" element={<ITCalculatorUpload />} />
        <Route path="/itDeclaration" element={<ITDeclaration />} />
        {Object.keys(PLACEHOLDER_SCREENS).map((key) => (
          <Route
            key={key}
            path={`/${key}`}
            element={<PlaceholderScreen title={PLACEHOLDER_SCREENS[key]} />}
          />
        ))}
        <Route
          path="*"
          element={<Navigate to="/submittedDeclarations" replace />}
        />
      </Routes>
    );
  };

  return (
    <div className={styles.dashboard}>
      <AppHeader />
      <div className={styles.body}>
        <SideNav role={role} activeKey={activeScreen} />
        <main className={styles.content}>{renderDashboardContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
