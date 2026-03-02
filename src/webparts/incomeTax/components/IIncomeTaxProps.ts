import { SPHttpClient } from "@microsoft/sp-http";
import { AppRole } from "../../../common/models";

export interface IIncomeTaxProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  /** SPHttpClient instance for making authenticated SharePoint REST calls. */
  spHttpClient: SPHttpClient;
  /** Absolute URL of the current SharePoint site. */
  siteUrl: string;
  /** Role of the current user — controls which nav items are visible. */
  userRole: AppRole;
  /** SharePoint WebPart context object required for PnP controls. */
  context: any;
}
