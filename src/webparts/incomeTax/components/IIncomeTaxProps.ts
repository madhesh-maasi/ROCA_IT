import { SPHttpClient } from '@microsoft/sp-http';

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
}
