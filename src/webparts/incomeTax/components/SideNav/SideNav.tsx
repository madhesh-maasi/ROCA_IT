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
import { useAppSelector } from "../../../../store/hooks";
import { selectUserDetails } from "../../../../store/slices/userSlice";
import { NAV_CONFIG } from "../../../../common/constants/appConstants";
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
  const user = useAppSelector(selectUserDetails);

  const [collapsed, setCollapsed] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    itDeclaration: true,
    administration: true,
  });

  React.useEffect(() => {
    if (!user?.Email) return;
  }, [user]);

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

      <div className={styles["buttonContainer" as keyof typeof styles]}></div>

      <ul className={styles.navList}>
        {visibleGroups.map((group) => {
          const groupIcon =
            ICON_MAP[group.icon as keyof typeof ICON_MAP] ?? FileEditIcon;
          const visibleItems = group.items.filter((item) =>
            canSee(role, item.allowedRoles),
          );
          const isOpen = openGroups[group.key];
          const hasActiveChild = visibleItems.some(
            (item) => activeKey === item.key,
          );

          return (
            <li key={group.key}>
              {/* Group header — accordion trigger */}
              <div
                className={`${styles.groupHeader} ${hasActiveChild ? styles.groupHeaderActive : ""}`}
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
                      <span className={styles.navItemText} title={item.label}>
                        {item.label}
                      </span>
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
