import * as React from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileEditIcon,
  Invoice03Icon,
  Calculator01Icon,
  ShieldUserIcon,
  UserMultiple02Icon,
  Settings01Icon,
  Search01Icon,
  FileUploadIcon,
  Calendar04Icon,
  FileExportIcon,
  ArrowUpDownIcon,
  CloudUploadIcon,
  CheckmarkCircle01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { AppRole, INavGroup } from "../../../../common/models";
import { ActionButton } from "../../../../components";
import { useAppSelector, useAppDispatch } from "../../../../store/hooks";
import {
  selectIncomeTaxItems,
  fetchIncomeTaxItems,
} from "../../../../store/slices/incomeTaxSlice";
import { selectUserDetails } from "../../../../store/slices/userSlice";
import { updateListItem } from "../../../../common/utils/pnpService";
import { LIST_NAMES } from "../../../../common/constants/appConstants";
import TaxRegimePopup from "../screens/SubmittedDeclarations/TaxRegimePopup";
import styles from "./SideNav.module.scss";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
  fileEdit: FileEditIcon,
  submittedDeclarations: Invoice03Icon,
  itCalculator: Calculator01Icon,
  administration: ShieldUserIcon,
  employeeDeclaration: UserMultiple02Icon,
  sectionConfig: Settings01Icon,
  lookupConfig: Search01Icon,
  releaseDeclaration: FileUploadIcon,
  extendSubmission: Calendar04Icon,
  exportDeclaration: FileExportIcon,
  taxRegimeUpdate: ArrowUpDownIcon,
  itCalculatorUpload: CloudUploadIcon,
  financeApprover: CheckmarkCircle01Icon,
} as const;

const ICON_SIZE = 20;
const ICON_SIZE_SM = 18;

// ─── Nav configuration ────────────────────────────────────────────────────────

const NAV_GROUPS: INavGroup[] = [
  {
    key: "itDeclaration",
    label: "IT Declaration",
    icon: "fileEdit",
    items: [
      {
        key: "submittedDeclarations",
        label: "Submitted Declarations",
        icon: "submittedDeclarations",
      },
      { key: "itCalculator", label: "IT Calculator", icon: "itCalculator" },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    icon: "administration",
    allowedRoles: ["Admin", "FinanceApprover"],
    items: [
      {
        key: "employeeDeclaration",
        label: "Employee Declaration",
        icon: "employeeDeclaration",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "sectionConfig",
        label: "Section Config",
        icon: "sectionConfig",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "lookupConfig",
        label: "Lookup Config",
        icon: "lookupConfig",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "releaseDeclaration",
        label: "Release Declaration",
        icon: "releaseDeclaration",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "extendSubmission",
        label: "Extend Submission",
        icon: "extendSubmission",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "exportDeclaration",
        label: "Export Declaration",
        icon: "exportDeclaration",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "taxRegimeUpdate",
        label: "Tax Regime Update",
        icon: "taxRegimeUpdate",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "itCalculatorUpload",
        label: "IT Calculator Upload",
        icon: "itCalculatorUpload",
        allowedRoles: ["FinanceApprover"],
      },
      {
        key: "financeApprover",
        label: "Finance Approver",
        icon: "financeApprover",
        allowedRoles: ["Admin", "FinanceApprover"],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const canSee = (role: AppRole, allowedRoles?: AppRole[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
};

// ─── Accordion sub-list ───────────────────────────────────────────────────────

interface IAccordionListProps {
  open: boolean;
  children: React.ReactNode;
}

const AccordionList: React.FC<IAccordionListProps> = ({ open, children }) => {
  const ref = React.useRef<HTMLUListElement>(null);
  const [height, setHeight] = React.useState<number>(0);

  React.useEffect(() => {
    if (ref.current) {
      setHeight(open ? ref.current.scrollHeight : 0);
    }
  }, [open]);

  return (
    <ul
      ref={ref}
      className={styles.subList}
      style={{
        maxHeight: `${height}px`,
        overflow: "hidden",
        transition: "max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </ul>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ISideNavProps {
  role: AppRole;
  activeKey: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SideNav: React.FC<ISideNavProps> = ({ role, activeKey }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUserDetails);
  const itItems = useAppSelector(selectIncomeTaxItems);

  const [collapsed, setCollapsed] = React.useState(false);
  const [showTaxPopup, setShowTaxPopup] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    itDeclaration: true,
    administration: true,
  });

  // Calculate if the "New IT Declaration" button should be shown
  // It shows if there is an item with Status "Draft" for the current user
  const draftItem = React.useMemo(() => {
    if (!user || !itItems) return null;
    const userEmail = user.Email || user.LoginName;
    return itItems.find(
      (item) =>
        (item.EmployeeID === userEmail || item.Author?.Email === userEmail) &&
        item.Status === "Draft",
    );
  }, [user, itItems]);

  const showNewDeclaration = Boolean(draftItem);

  const handleRegimeSubmit = async (regime: string) => {
    if (!draftItem) return;
    setIsSubmitting(true);
    try {
      await updateListItem(LIST_NAMES.INCOME_TAX, draftItem.Id, {
        RegimeType: regime,
        // Optional: Update status to "In Progress" or similar if required
      });
      setShowTaxPopup(false);
      // Refresh data
      void dispatch(
        fetchIncomeTaxItems({ getItems: () => Promise.resolve([]) }),
      );
      // Navigate to the declaration screen
      navigate("/it-declaration");
    } catch (error) {
      console.error("Error updating tax regime", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroup = (key: string): void => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleGroups = NAV_GROUPS.filter((g) => canSee(role, g.allowedRoles));

  // ── Collapsed mode: flat list of all child item icons ─────────────────────
  if (collapsed) {
    return (
      <nav className={`${styles.sideNav} ${styles.sideNavCollapsed}`}>
        {/* Expand button */}
        <ActionButton
          className={`${styles.toggleBtn} rounded`}
          onClick={() => setCollapsed(false)}
          title="Expand"
          variant="expand"
        />

        <ul className={`${styles.navList} ${styles.collapsed}`}>
          {visibleGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              canSee(role, item.allowedRoles),
            );
            return visibleItems.map((item) => {
              const iconData =
                ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? Invoice03Icon;
              const isActive = activeKey === item.key;
              return (
                <li
                  key={item.key}
                  className={`${styles.collapsedItem} ${isActive ? styles.collapsedItemActive : ""}`}
                  onClick={() => navigate("/" + item.key)}
                  title={item.label}
                >
                  <HugeiconsIcon
                    icon={iconData}
                    size={ICON_SIZE}
                    strokeWidth={isActive ? 2 : 1.6}
                    className={styles.itemIcon}
                  />
                </li>
              );
            });
          })}
        </ul>
      </nav>
    );
  }

  // ── Expanded mode: accordion ───────────────────────────────────────────────
  return (
    <nav className={styles.sideNav}>
      {/* Collapse button */}
      <ActionButton
        variant="collapse"
        className={`${styles.toggleBtn} rounded`}
        onClick={() => setCollapsed(true)}
        title="Collapse"
      />

      <div className={styles["buttonContainer" as keyof typeof styles]}>
        {showNewDeclaration && (
          <ActionButton
            variant="newDeclaration"
            onClick={() => setShowTaxPopup(true)}
          />
        )}
      </div>

      <ul className={styles.navList}>
        {visibleGroups.map((group) => {
          const groupIcon =
            ICON_MAP[group.icon as keyof typeof ICON_MAP] ?? FileEditIcon;
          const visibleItems = group.items.filter((item) =>
            canSee(role, item.allowedRoles),
          );
          const isOpen = openGroups[group.key];

          return (
            <li key={group.key}>
              {/* Group header — accordion trigger */}
              <div
                className={styles.groupHeader}
                onClick={() => toggleGroup(group.key)}
              >
                <HugeiconsIcon
                  icon={groupIcon}
                  size={ICON_SIZE}
                  strokeWidth={1.8}
                  className={styles.groupIcon}
                />
                <span className={styles.groupLabel}>{group.label}</span>
                <span
                  className={`${styles.chevron} ${isOpen ? styles.chevronOpen : styles.chevronClosed}`}
                >
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={14}
                    strokeWidth={2}
                  />
                </span>
              </div>

              {/* Accordion sub-list */}
              <AccordionList open={isOpen}>
                {visibleItems.map((item) => {
                  const itemIcon =
                    ICON_MAP[item.icon as keyof typeof ICON_MAP] ??
                    Invoice03Icon;
                  const isActive = activeKey === item.key;
                  return (
                    <li
                      key={item.key}
                      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                      onClick={() => navigate("/" + item.key)}
                    >
                      <HugeiconsIcon
                        icon={itemIcon}
                        size={ICON_SIZE_SM}
                        strokeWidth={isActive ? 2 : 1.6}
                        className={styles.itemIcon}
                      />
                      <span className={styles.navItemText}>{item.label}</span>
                    </li>
                  );
                })}
              </AccordionList>
            </li>
          );
        })}
      </ul>

      <TaxRegimePopup
        visible={showTaxPopup}
        onHide={() => setShowTaxPopup(false)}
        onSubmit={handleRegimeSubmit}
        isLoading={isSubmitting}
      />
    </nav>
  );
};

export default SideNav;
