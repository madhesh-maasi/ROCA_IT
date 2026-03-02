import * as React from "react";
import styles from "./IconButton.module.scss";
import { HugeiconsIcon } from "@hugeicons/react";

export interface IIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon class string (e.g. 'pi pi-pencil') OR a Hugeicons icon object */
  icon: string | any;
  /** The visual variant applied to the icon button */
  variant?: "edit" | "delete" | "default";
  /** Size for Hugeicons (if applicable). Defaults to 18. */
  iconSize?: number;
}

/**
 * A specialized common component strictly for icon-only actions (like Edit/Delete in datatables).
 * Provides clean bounding boxes, color variants, and distinct hover states.
 */
const IconButton: React.FC<IIconButtonProps> = ({
  icon,
  variant = "default",
  className,
  iconSize = 18,
  ...rest
}) => {
  const isStringIcon = typeof icon === "string";

  return (
    <button
      type="button"
      className={`${styles.iconButton} ${styles[variant]} ${className || ""}`}
      {...rest}
    >
      {isStringIcon ? (
        <i className={icon as string} />
      ) : (
        <HugeiconsIcon icon={icon} size={iconSize} strokeWidth={1.8} />
      )}
    </button>
  );
};

export { IconButton };
export default IconButton;
