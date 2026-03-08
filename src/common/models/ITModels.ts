import { IListItem } from "./IBaseModel";

/**
 * Main IT Planned Declaration item.
 */
export interface IPlannedDeclaration extends IListItem {
  EmployeeID: string;
  FinancialYear: string;
  Status: "Draft" | "Submitted" | "Released" | "Approved" | "Rejected";
  RegimeType?: "Old Regime" | "New Regime";
  DeclarationType?: "Planned" | "Actual";
  PAN?: string;
  RentDetailsJSON?: string; // Multiline JSON (April–March)
  IsAcknowledged?: "Yes" | "No";
  Place?: string;
  SubmittedDate?: string;
  TotalLTA?: string;
  Total80CDeductions?: string;
  TotalHouseRent?: string;
  TotalHouingLoanRepayment?: string;
}

/**
 * Landlord Details (Multiple).
 */
export interface ILandlordDetails extends IListItem {
  Title: string; // Landlord Name
  PAN: string;
  Address: string;
  PlannedDeclarationId: number;
}

/**
 * LTA Record (Multiple).
 */
export interface ILTARecord extends IListItem {
  ExemptionAmount: string;
  JourneyStartDate: string;
  JourneyEndDate: string;
  PlannedDeclarationId: number;
  Place: string;
  Destination: string;
  ModeOfTravel: string;
  ClassOfTravel: string;
  TicketNumbers: string;
  LastLTAYear: string;
  COTravellerJSON: string; // Multiline JSON
}

/**
 * Section 80C Investment (Multiple).
 */
export interface IInvestment80C extends IListItem {
  TypeOfInvestmentId: number; // Lookup to 80C Master
  Amount: string;
  PlannedDeclarationId: number;
}

/**
 * Section 80 Details (Multiple).
 */
export interface IInvestment80D extends IListItem {
  TypeOfInvestmentId: number; // Lookup
  SubsectionId?: number; // Lookup
  Amount: string;
  PlannedDeclarationId: number;
}

/**
 * Housing Loan Repayment.
 */
export interface IHousingLoan extends IListItem {
  PropertyType: string; // Choice
  Interest: string;
  PANofLender: string;
  LenderType: string; // Choice
  IsJointlyAvailedPropertyLoan: "Yes" | "No";
  PlannedDeclarationId: number;
}

/**
 * Previous Employer Details.
 */
export interface IPreviousEmployer extends IListItem {
  EmployeePAN: string;
  Address: string;
  TAN: string;
  EmploymentFrom: string;
  EmploymentTo: string;
  SalaryAfterExemptionUS10: string;
  PFContribution: string;
  VPF: string;
  ProfessionalTax: string;
  TDS: string;
  PlannedDeclarationId: number;
}
