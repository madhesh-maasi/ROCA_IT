import * as React from "react";
import { HashRouter } from "react-router-dom";
import type { IIncomeTaxProps } from "./IIncomeTaxProps";
import { ErrorBoundary } from "../../../common";
import Dashboard from "./Dashboard/Dashboard";
import "../../../common/Asset/CSS/Style.css";
import "../../../common/Asset/CSS/primeicons.css";
import { Loader } from "../../../common/components";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchUserContext,
  selectUserRole,
  selectUserDetails,
  selectUserLoading,
  fetchEmployeeMaster,
  fetchSiteMembers,
} from "../../../store/slices";

export const SPWebPartContext = React.createContext<any>(null);

const IncomeTax: React.FC<IIncomeTaxProps> = (props) => {
  const dispatch = useAppDispatch();
  const role = useAppSelector(selectUserRole);
  const userDetails = useAppSelector(selectUserDetails);
  const isLoading = useAppSelector(selectUserLoading);

  React.useEffect(() => {
    void dispatch(fetchUserContext());
    void dispatch(
      fetchEmployeeMaster(props.context.pageContext.web.absoluteUrl),
    );
    void dispatch(fetchSiteMembers());
  }, [dispatch, props.context]);

  if (isLoading) {
    return <Loader label="Loading..." />;
  }

  return (
    <SPWebPartContext.Provider value={props.context}>
      <ErrorBoundary>
        <HashRouter>
          <Dashboard
            role={role}
            userDisplayName={userDetails?.Title || props.userDisplayName}
          />
        </HashRouter>
      </ErrorBoundary>
    </SPWebPartContext.Provider>
  );
};

export default IncomeTax;
