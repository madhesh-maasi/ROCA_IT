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
import { ActionButton } from "../../../../CommonInputComponents";
import { useAppSelector, useAppDispatch } from "../../../../store/hooks";
import { fetchIncomeTaxItems } from "../../../../store/slices/incomeTaxSlice";
import { selectUserDetails } from "../../../../store/slices/userSlice";
import {
  updateListItem,
  getSP,
  getListItems,
} from "../../../../common/utils/pnpService";
import {
  LIST_NAMES,
  NAV_CONFIG,
} from "../../../../common/constants/appConstants";
import { curFinanicalYear } from "../../../../common/utils/functions";
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

const NAV_GROUPS: INavGroup[] = NAV_CONFIG;

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

  const [collapsed, setCollapsed] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    itDeclaration: true,
    administration: true,
  });

  // ── New IT Declaration button state ──────────────────────────────────────
  // Tracks whether to show the button and which declaration type drives it
  const [releasedDeclarationType, setReleasedDeclarationType] = React.useState<
    "Planned" | "Actual" | null
  >(null);
  const [releasedItemId, setReleasedItemId] = React.useState<number | null>(
    null,
  );

  // TaxRegimePopup state (used only for Planned path)
  const [showTaxRegimePopup, setShowTaxRegimePopup] = React.useState(false);
  const [isSavingRegime, setIsSavingRegime] = React.useState(false);

  // Fetch Released record from both Planned and Actual lists on mount / user change
  React.useEffect(() => {
    if (!user?.Email) return;

    const check = async () => {
      try {
        const sp = getSP();
        const email = user.Email.toLowerCase();
        const fy = curFinanicalYear;
        const baseFilter = `EmployeeEmail eq '${email}' and FinancialYear eq '${fy}' and Status eq 'Released' and IsDelete eq false`;

        // Check Planned first
        const plannedItems = await sp.web.lists
          .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
          .items.select("Id", "TaxRegime")
          .filter(baseFilter)
          .top(1)();

        if (plannedItems.length > 0 && !plannedItems[0].TaxRegime) {
          setReleasedDeclarationType("Planned");
          setReleasedItemId(plannedItems[0].Id);
          return;
        }

        // Check Actual
        const actualItems = await sp.web.lists
          .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
          .items.select("Id")
          .filter(baseFilter)
          .top(1)();

        if (actualItems.length > 0) {
          setReleasedDeclarationType("Actual");
          setReleasedItemId(actualItems[0].Id);
          return;
        }

        // No released record found
        setReleasedDeclarationType(null);
        setReleasedItemId(null);
      } catch (e) {
        console.error("SideNav: failed to check released declarations", e);
      }
    };

    void check();
  }, [user]);

  const showNewDeclaration = releasedDeclarationType !== null;

  // Handle Tax Regime submit (Planned path)
  const handleTaxRegimeSubmit = async (regime: string) => {
    if (!releasedItemId) return;
    setIsSavingRegime(true);
    try {
      await updateListItem(LIST_NAMES.PLANNED_DECLARATION, releasedItemId, {
        TaxRegime: regime,
      });
      setShowTaxRegimePopup(false);
      // Refresh redux store
      void dispatch(
        fetchIncomeTaxItems({
          getItems: () => {
            const filterStr = `EmployeeEmail eq '${user!.Email}'`;
            return getListItems(LIST_NAMES.PLANNED_DECLARATION, filterStr);
          },
        }),
      );
      navigate("/itDeclaration");
    } catch (e) {
      console.error("Failed to save TaxRegime", e);
    } finally {
      setIsSavingRegime(false);
    }
  };

  // Handle button click based on declaration type
  const handleNewDeclarationClick = () => {
    if (releasedDeclarationType === "Planned") {
      setShowTaxRegimePopup(true);
    } else if (releasedDeclarationType === "Actual") {
      navigate("/actualItDeclaration");
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
        <button
          className={`${styles.toggleBtn} rounded`}
          onClick={() => setCollapsed(false)}
          title="Expand"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.5} />
        </button>

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
      <button
        className={`${styles.toggleBtn} rounded`}
        onClick={() => setCollapsed(true)}
        title="Collapse"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2.5} />
      </button>

      <div className={styles["buttonContainer" as keyof typeof styles]}>
        {showNewDeclaration && (
          <ActionButton
            variant="newDeclaration"
            onClick={handleNewDeclarationClick}
          />
        )}
      </div>

      {/* Tax Regime Popup — shown only for Planned declaration path */}
      <TaxRegimePopup
        visible={showTaxRegimePopup}
        onHide={() => setShowTaxRegimePopup(false)}
        onSubmit={(regime) => {
          void handleTaxRegimeSubmit(regime);
        }}
        isLoading={isSavingRegime}
      />

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
    </nav>
  );
};

export default SideNav;
