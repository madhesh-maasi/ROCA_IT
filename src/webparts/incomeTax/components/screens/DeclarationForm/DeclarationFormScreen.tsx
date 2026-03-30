import * as React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import { selectUserDetails } from "../../../../../store/slices/userSlice";
import { selectEmployees } from "../../../../../store/slices/employeeSlice";
import { curFinanicalYear } from "../../../../../common/utils/functions";
import SubmissionForm from "../ActualITDeclaration/SubmissionForm/SubmissionForm";
import { ActionButton } from "../../../../../CommonInputComponents";
import { AppToast, Loader, showToast } from "../../../../../common/components";
import { generatePDFBlob } from "../../../../../common/utils/pdfUtils";
import {
  getSP,
  getItemById,
  getRelatedListItems,
  updateListItem,
  uploadDeclarationPDF,
} from "../../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../../common/constants/appConstants";
import styles from "./DeclarationFormScreen.module.scss";
import { Toast as PrimeToast } from "primereact/toast";
import moment from "moment";

const DeclarationFormScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = React.useRef<PrimeToast>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectUserDetails);
  const employeeMaster = useAppSelector(selectEmployees);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [data, setData] = React.useState<any>(null);

  // New state for submission details
  const [isAgreed, setIsAgreed] = React.useState(false);
  const [submittedUserName, setSubmittedUserName] = React.useState("");
  const [submittedDesignation, setSubmittedDesignation] = React.useState("");
  const [submittedPlace, setSubmittedPlace] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const mainItem: any = await getItemById(
          LIST_NAMES.ACTUAL_DECLARATION,
          Number(id),
        );

        // Fetch related data for summary
        const [ltaItems, items80C, items80D, hlItems, peItems] =
          await Promise.all([
            getRelatedListItems(
              LIST_NAMES.IT_LTA_Actual,
              Number(id),
              "ActualDeclarationId",
            ),
            getRelatedListItems(
              LIST_NAMES.IT_80C_SECTION_Actual,
              Number(id),
              "ActualDeclarationId",
            ),
            getRelatedListItems(
              LIST_NAMES.IT_80_Actual,
              Number(id),
              "ActualDeclarationId",
            ),
            getRelatedListItems(
              LIST_NAMES.IT_HOUSING_LOAN_Actual,
              Number(id),
              "ActualDeclarationId",
            ),
            getRelatedListItems(
              LIST_NAMES.IT_PREVIOUS_EMPLOYER_Actual,
              Number(id),
              "ActualDeclarationId",
            ),
          ]);

        const totalLTA = ltaItems.reduce(
          (acc: number, curr: any) => acc + Number(curr.ExemptionAmount || 0),
          0,
        );
        const total80C = items80C.reduce(
          (acc: number, curr: any) => acc + Number(curr.Amount || 0),
          0,
        );
        const total80D = items80D.reduce(
          (acc: number, curr: any) => acc + Number(curr.Amount || 0),
          0,
        );

        let hlSelf = 0;
        let hlLetOut = 0;
        if (hlItems.length > 0) {
          const hl = hlItems[0];
          if (hl.PropertyType === "Self Occupied") {
            hlSelf = Number(hl.Interest || 0);
          } else if (hl.PropertyType === "Let Out Property") {
            hlLetOut = Number(hl.LetOutInterest || 0);
          }
        }

        const peIncome =
          peItems.length > 0
            ? Number(peItems[0].SalaryAfterExemptionUS10 || 0)
            : 0;

        let rentTotal = 0;
        if (mainItem.RentDetailsJSON) {
          try {
            const rentArr = JSON.parse(mainItem.RentDetailsJSON);
            rentTotal = rentArr.reduce(
              (acc: number, curr: any) => acc + Number(curr.rent || 0),
              0,
            );
          } catch (e) {}
        }

        // Find employee info
        const empEmail = mainItem.EmployeeEmail || user?.Email;
        const employee = employeeMaster.find((e) => e.Email === empEmail);

        const isReadOnly = mainItem.DeclarationStatus === "Submitted";

        setData({
          isReadOnly,
          employeeInfo: {
            employeeCode: employee?.EmployeeId || "-",
            employeeName: employee?.Title || user?.Title || "-",
            location: employee?.Location || "-",
            panNumber: mainItem.PAN || employee?.PAN || "-",
            officialEmailId: empEmail || "-",
            mobileNumber: mainItem.MobileNumber || "-",
            financialYear: mainItem.FinancialYear || curFinanicalYear,
            dateOfJoining: employee?.DOJ || "-",
            taxRegime: mainItem.TaxRegime || "-",
          },
          declarationSummary: {
            lta: totalLTA?.toLocaleString(),
            houseRental: rentTotal?.toLocaleString(),
            section80C: total80C?.toLocaleString(),
            section80D: total80D?.toLocaleString(),
            housingLoanSelfOccupied: hlSelf?.toLocaleString(),
            housingLoanLetOut: hlLetOut?.toLocaleString(),
            previousEmployerIncome: peIncome?.toLocaleString(),
          },
        });

        // Pre-fill user details
        setSubmittedUserName(
          mainItem.SubmittedUserName || employee?.Title || user?.Title || "",
        );
        setSubmittedDesignation(
          mainItem.SubmittedDesignation || employee?.Designation || "",
        );
        setSubmittedPlace(mainItem.SubmittedPlace || employee?.Location || "");
        setIsAgreed(mainItem.IsAgreed || false);

        // Auto-print if param is present
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get("print") === "true") {
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      } catch (error) {
        console.error("Error fetching declaration data", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [id, user, employeeMaster, location.search]);

  const handleSubmit = async () => {
    if (!id) return;
    setIsSubmitting(true);
    if (!isAgreed) {
      showToast(
        toast,
        "error",
        "Error",
        "Please agree to the declaration statement before submitting.",
      );
      setIsSubmitting(false);
      return;
    }
    if (!submittedUserName || !submittedDesignation || !submittedPlace) {
      showToast(
        toast,
        "error",
        "Error",
        `Please provide ${!submittedUserName ? "User name" : !submittedDesignation ? "Designation" : "Place"}`,
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Generate PDF of the form
      const fileName = `Declaration_${data.employeeInfo.employeeCode}_${data.employeeInfo.financialYear}`;
      const pdfBlob = await generatePDFBlob(
        "declaration-form-content",
        fileName,
      );

      // 2. Upload to ITDocuments
      await uploadDeclarationPDF(
        data.employeeInfo.financialYear,
        data.employeeInfo.employeeCode,
        pdfBlob,
        Number(id),
      );

      // 3. Update status and metadata
      await updateListItem(LIST_NAMES.ACTUAL_DECLARATION, Number(id), {
        DeclarationStatus: "Submitted",
        SubmittedUserName: submittedUserName,
        SubmittedDesignation: submittedDesignation,
        SubmittedPlace: submittedPlace,
        SubmissionDate: moment().format("DD/MM/YYYY HH:mm"),
        DeclarationIsAgreed: true,
      });
      navigate("/submittedDeclarations", { state: { tab: "Actual" } });
    } catch (error) {
      console.error("Error updating status", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader label="Loading form..." />;
  if (!data) return <div>Error loading declaration data.</div>;

  return (
    <>
      <AppToast toastRef={toast} />
      {isSubmitting && <Loader label="Submitting and generating PDF..." />}
      <div className={styles.screen}>
        <div className={styles.header}>
          <h2>Investment Submission Form</h2>
          {/* <ActionButton
            variant="continue"
            label="Print"
            icon="pi pi-print"
            onClick={() => window.print()}
            style={{ background: "#307a8a", color: "white" }}
          /> */}
        </div>

        <div className={styles.formContainer} id="declaration-form-content">
          <SubmissionForm
            employeeInfo={data.employeeInfo}
            declarationSummary={data.declarationSummary}
            isAgreed={isAgreed}
            onAgreedChange={setIsAgreed}
            submittedPlace={submittedPlace}
            onPlaceChange={setSubmittedPlace}
            submittedUserName={submittedUserName}
            onUserNameChange={setSubmittedUserName}
            submittedDesignation={submittedDesignation}
            onDesignationChange={setSubmittedDesignation}
            isReadOnly={data.isReadOnly}
          />
        </div>

        <div className={styles.footer}>
          <ActionButton
            variant="cancel"
            label="Cancel"
            onClick={() => navigate(-1)}
          />
          {!data.isReadOnly && (
            <ActionButton
              variant="save"
              label="Submit"
              onClick={handleSubmit}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default DeclarationFormScreen;
