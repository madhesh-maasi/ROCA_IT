import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import "@pnp/sp/batching";
import { deploymentConfig } from "../constants";
import { LIST_NAMES } from "../constants/appConstants";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { handleError } from "./errorUtils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ─── Singleton ────────────────────────────────────────────────────────────────

let _sp: SPFI | null = null;

/**
 * Initialise PnP once from the WebPart context.
 * Call this inside your WebPart's `onInit()` before any service calls.
 *
 * @example
 * // In your WebPart
 * protected async onInit(): Promise<void> {
 *   initPnP(this.context);
 * }
 */
let _ctx: WebPartContext | null = null;

export const initPnP = (context: WebPartContext): void => {
  _ctx = context;
  _sp = spfi().using(SPFx(context));
};

/**
 * Returns the initialised SPFI instance.
 * Throws if `initPnP` has not been called yet.
 */
export const getSP = (): SPFI => {
  if (!_sp) {
    throw new Error(
      "[pnpService] PnP has not been initialised. Call initPnP(context) in onInit().",
    );
  }
  return _sp;
};

/**
 * Returns the stored WebPartContext.
 * Used by services (e.g. emailService) that need direct access to the context
 * for features like MSGraphClientFactory.
 */
export const getContext = (): WebPartContext => {
  if (!_ctx) {
    throw new Error(
      "[pnpService] Context has not been initialised. Call initPnP(context) in onInit().",
    );
  }
  return _ctx;
};

/**
 * Fetch all items from a SharePoint list.
 *
 * @param listName  - Internal name of the list.
 * @param select    - Fields to select (e.g. ["Id", "Title", "Status"]).
 * @param orderBy   - Field to sort by.
 * @param ascending - Sort direction (default: true).
 *
 * @example
 * const items = await getAllItems<IIncomeTax>("IncomeTax", ["Id", "Title"]);
 */
export const getAllItems = async <T>(
  listName: string,
  select?: string[],
  expand?: string,
  orderBy?: string,
  ascending = true,
  filter?: string,
): Promise<T[]> => {
  try {
    const sp = getSP();
    let query: any = sp.web.lists.getByTitle(listName).items;

    if (select && select.length > 0) {
      // Concatenate "*" with any specific fields provided
      query = query.select("*", ...select);
    }

    if (expand) {
      query = query.expand(expand);
    }

    if (filter) {
      query = query.filter(filter);
    }

    if (orderBy) {
      query = query.orderBy(orderBy, ascending);
    }

    return await query();
  } catch (err) {
    await handleError(err, `Fetching items from ${listName}`);
    return [];
  }
};

/**
 * Fetch a single list item by its numeric ID.
 *
 * @param listName - Internal name of the list.
 * @param id       - Item ID.
 * @param select   - Fields to select.
 *
 * @example
 * const item = await getItemById<IIncomeTax>("IncomeTax", 42, ["Id", "Title"]);
 */
export const getItemById = async <T>(
  listName: string,
  id: number,
  select?: string[],
): Promise<T> => {
  const sp = getSP();
  const item = sp.web.lists.getByTitle(listName).items.getById(id);

  if (select?.length) {
    return item.select(...select)<T>();
  }
  return item<T>();
};

/**
 * Add a new item to a SharePoint list.
 *
 * @param listName - Internal name of the list.
 * @param data     - Key-value pairs to set on the new item.
 * @returns The server response containing the new item's Id.
 *
 * @example
 * const result = await addItem("IncomeTax", { Title: "FY2026", Status: "Draft" });
 * console.log(result.data.Id);
 */
export const addItem = async (
  listName: string,
  data: Record<string, unknown>,
): Promise<{ data: { Id: number } }> => {
  const sp = getSP();
  return sp.web.lists.getByTitle(listName).items.add(data);
};

/**
 * Update an existing list item.
 *
 * @param listName - Internal name of the list.
 * @param id       - Item ID to update.
 * @param data     - Fields to update.
 *
 * @example
 * await updateItem("IncomeTax", 42, { Status: "Approved" });
 */
export const updateItem = async (
  listName: string,
  id: number,
  data: Record<string, unknown>,
): Promise<void> => {
  const sp = getSP();
  await sp.web.lists.getByTitle(listName).items.getById(id).update(data);
};

/**
 * Recycle (soft-delete) a list item by ID.
 *
 * @param listName - Internal name of the list.
 * @param id       - Item ID to delete.
 *
 * @example
 * await deleteItem("IncomeTax", 42);
 */
export const deleteItem = async (
  listName: string,
  id: number,
): Promise<void> => {
  const sp = getSP();
  await sp.web.lists.getByTitle(listName).items.getById(id).recycle();
};

// ─── User Helpers ─────────────────────────────────────────────────────────────

export interface ICurrentUser {
  Id: number;
  Title: string;
  Email: string;
  LoginName: string;
}

/**
 * Fetch the currently logged-in SharePoint user's profile.
 *
 * @example
 * const user = await getCurrentUser();
 * console.log(user.Email);
 */
export const getCurrentUser = async (): Promise<ICurrentUser> => {
  const sp = getSP();
  return sp.web.currentUser.select(
    "Id",
    "Title",
    "Email",
    "LoginName",
  )<ICurrentUser>();
};

/**
 * Fetch the groups the current user belongs to.
 */
export const getCurrentUserGroups = async (): Promise<any[]> => {
  const sp = getSP();
  return sp.web.currentUser.groups();
};

/**
 * Fetch the site owners group.
 */
export const getSiteOwnersGroup = async (): Promise<any> => {
  const sp = getSP();
  return sp.web.associatedOwnerGroup();
};

/**
 * Fetch the site members group.
 */
export const getSiteMembersGroup = async (): Promise<any> => {
  const sp = getSP();
  return sp.web.associatedMemberGroup();
};

/**
 * Fetch Employee Master users from the master site.
 * Builds a new SPFI with SPFx auth targeting the remote site URL.
 */
export const getEmployeeMasterUsers = async (
  currentSiteUrl: string,
): Promise<any[]> => {
  try {
    if (!_ctx) {
      throw new Error("PnP context not initialised. Call initPnP() first.");
    }

    const masterSiteUrl = deploymentConfig(currentSiteUrl);

    // PnP v3 cross-site pattern: new spfi targeting the remote site root,
    // but reusing the same SPFx(context) behaviour for authentication.
    const remoteSp = masterSiteUrl
      ? spfi(masterSiteUrl).using(SPFx(_ctx))
      : getSP();

    const items: any[] = await remoteSp.web.lists
      .getByTitle(LIST_NAMES.EMPLOYEE_MASTER)
      .items.select("*,Location/Title")
      .expand("Location")
      .filter("IsActive eq 1")
      .top(5000)();

    return items;
  } catch (err) {
    await handleError(err, `Fetching ${LIST_NAMES.EMPLOYEE_MASTER}`);
    return [];
  }
};

/**
 * Fetch all users in the site's Associated Owners (Admins) group.
 */
export const getSiteAdminsGroupUsers = async (): Promise<any[]> => {
  const sp = getSP();
  try {
    return await sp.web.associatedOwnerGroup.users();
  } catch (err) {
    await handleError(err, "Fetching site admins group users");
    return [];
  }
};

/**
 * Fetch all users in the site.
 */
export const getSiteMembersGroupUsers = async (): Promise<any[]> => {
  const sp = getSP();
  try {
    return await sp.web.siteUsers.filter(
      "PrincipalType eq 1 and Email ne null",
    )();
  } catch (err) {
    await handleError(err, "Fetching site users");
    return [];
  }
};

/**
 * Add a user (by login name) to a group identified by its numeric Id.
 */
export const addUserToGroupById = async (
  groupId: number,
  loginName: string,
): Promise<void> => {
  const sp = getSP();
  await sp.web.siteGroups.getById(groupId).users.add(loginName);
};

/**
 * Remove a user (by login name) from a group identified by its numeric Id.
 */
export const removeUserFromGroupById = async (
  groupId: number,
  loginName: string,
): Promise<void> => {
  const sp = getSP();
  await sp.web.siteGroups.getById(groupId).users.removeByLoginName(loginName);
};

/**
 * Upload a file to a specific SharePoint Document Library, overwriting if it exists.
 *
 * @param libraryName - Server Relative URL or Site Relative URL of the library (e.g. "IT_Calculator")
 * @param fileName    - Name of the file with extension
 * @param fileContent - The actual File object to upload
 */
export const uploadFileToLibrary = async (
  libraryName: string,
  fileName: string,
  fileContent: File,
): Promise<void> => {
  const sp = getSP();
  try {
    // Add the file, using { Overwrite: true } so duplicate files are overwritten
    await sp.web
      .getFolderByServerRelativePath(libraryName)
      .files.addUsingPath(fileName, fileContent, { Overwrite: true });
  } catch (err) {
    await handleError(err, `Uploading file to ${libraryName}`);
    throw err;
  }
};

/**
 * Get the latest (top 1) file URL from a specific document library list.
 *
 * @param libraryName
 */
export const getLatestFileUrl = async (
  libraryName: string,
): Promise<string | null> => {
  const sp = getSP();
  try {
    const files = await sp.web.lists
      .getByTitle(libraryName)
      .items.orderBy("ID", false)
      .top(1)
      .select("ID", "FileLeafRef", "FileRef")
      .filter("IsDelete ne 1")();

    if (files.length > 0) {
      return files[0].FileRef;
    }
    return null;
  } catch (err) {
    await handleError(err, `Fetching latest file from ${libraryName}`);
    throw err;
  }
};

/**
 * Upload a file and simultaneously update its metadata (e.g., FinanceYear).
 */
export const uploadFileWithMetadata = async (
  libraryName: string,
  fileName: string,
  fileContent: File,
  metadata: Record<string, any>,
): Promise<void> => {
  const sp = getSP();
  try {
    await sp.web
      .getFolderByServerRelativePath(libraryName)
      .files.addUsingPath(fileName, fileContent, { Overwrite: true });

    const file = sp.web
      .getFolderByServerRelativePath(libraryName)
      .files.getByUrl(fileName);

    const item = await file.getItem();
    await item.update(metadata);
  } catch (err) {
    await handleError(err, `Uploading file with metadata to ${libraryName}`);
    throw err;
  }
};

/**
 * Fetch files from a document library alongside their metadata properties.
 */
export const getLibraryFilesWithMetadata = async (
  libraryName: string,
  selectFields: string[] = [
    "ID",
    "FileLeafRef",
    "FileRef",
    "FinanceYear",
    "Created",
  ],
): Promise<any[]> => {
  const sp = getSP();
  try {
    return await sp.web.lists
      .getByTitle(libraryName)
      .items.select(...selectFields)
      .filter("IsDelete ne 1")
      .orderBy("ID", false)
      .top(5000)();
  } catch (err) {
    await handleError(err, `Fetching files with metadata from ${libraryName}`);
    return [];
  }
};

// ─── IT Documents Upload Helpers ───────────────────────────────────────────────

/**
 * Upload a PDF to the IT_Documents library under the structured folder:
 *   IT_Documents / {financialYear} / {employeeCode} / Declarations
 *
 */
export const uploadDeclarationPDF = async (
  financialYear: string,
  employeeCode: string,
  fileBlob: Blob,
  actualDeclarationId: number,
): Promise<string> => {
  const sp = getSP();
  try {
    const webInfo = await sp.web.select("ServerRelativeUrl")();
    const webUrl: string = (webInfo as any).ServerRelativeUrl || "";

    const libraryRelPath = `${webUrl}/IT_Documents`;
    const fyPath = `${libraryRelPath}/${sanitizeFolderName(financialYear)}`;
    const empPath = `${fyPath}/${sanitizeFolderName(employeeCode)}`;
    const sectionPath = `${empPath}/DeclarationForm`;

    // Ensure folders exist
    for (const path of [fyPath, empPath, sectionPath]) {
      await sp.web.folders.addUsingPath(path, true);
    }

    const fileName = `Declaration_${sanitizeFolderName(financialYear)}.pdf`;

    // Upload
    await sp.web
      .getFolderByServerRelativePath(sectionPath)
      .files.addUsingPath(fileName, fileBlob, { Overwrite: true });

    const fileServerRelUrl = `${sectionPath}/${fileName}`;
    const listItem = await sp.web
      .getFileByServerRelativePath(fileServerRelUrl)
      .getItem();

    await listItem.update({
      ActualDeclarationId: actualDeclarationId,
      IsDelete: false,
    });

    return fileServerRelUrl;
  } catch (err) {
    await handleError(err, "Uploading Declaration PDF");
    throw err;
  }
};

/**
 * Construct the standard server-relative URL for a declaration PDF.
 */
export const getDeclarationPDFUrl = async (
  financialYear: string,
  employeeCode: string,
): Promise<string> => {
  const sp = getSP();
  const webInfo = await sp.web.select("ServerRelativeUrl")();
  const webUrl: string = (webInfo as any).ServerRelativeUrl || "";

  return `${webUrl}/IT_Documents/${sanitizeFolderName(financialYear)}/${sanitizeFolderName(employeeCode)}/DeclarationForm/Declaration_${sanitizeFolderName(financialYear)}.pdf`;
};

/**
 * Upload a PDF to the IT_Documents library under the structured folder:
 *   IT_Documents / {financialYear} / {employeeCode} / {sectionType}
 *
 * The file is renamed to: {originalBaseName}_{yyyyMMddHHmmss}.pdf
 *
 * After upload, the following metadata columns are set on the library item:
 *   IsDelete            = false
 *   ActualDeclarationId = meta.actualDeclarationId (always required)
 *   LandLordId          = meta.landLordId          (only for House Rental rows)
 *   Section80CId        = meta.section80CId        (only for 80C rows)
 *   Section80DId        = meta.section80DId        (only for 80D rows)
 *
 * Soft-delete behaviour: Overwrite is disabled — each upload is a distinct file.
 * To "delete" a file, call updateListItem(IT_DOCUMENTS, id, { IsDelete: true }).
 */
export const uploadITDocument = async (
  financialYear: string,
  employeeCode: string,
  sectionType: string,
  file: File,
  meta: {
    actualDeclarationId: number;
    landLordId?: number;
    section80CId?: number;
    section80DId?: number;
  },
): Promise<void> => {
  const sp = getSP();
  try {
    // Get the site-relative URL of the current web
    const webInfo = await sp.web.select("ServerRelativeUrl")();
    const webUrl: string = (webInfo as any).ServerRelativeUrl || "";

    const libraryRelPath = `${webUrl}/IT_Documents`;
    const fyPath = `${libraryRelPath}/${sanitizeFolderName(financialYear)}`;
    const empPath = `${fyPath}/${sanitizeFolderName(employeeCode)}`;
    const sectionPath = `${empPath}/${sanitizeFolderName(sectionType)}`;

    // Ensure each folder level exists (addUsingPath is idempotent in PnP)
    for (const path of [fyPath, empPath, sectionPath]) {
      await sp.web.folders.addUsingPath(path, true);
    }

    // Append a timestamp to guarantee uniqueness across uploads
    const baseName = file.name.replace(/\.pdf$/i, "");
    const ts = buildTimestamp();
    const fileName = `${baseName}_${ts}.pdf`;

    // Upload — Overwrite: false so each upload is a new file preserving history
    await sp.web
      .getFolderByServerRelativePath(sectionPath)
      .files.addUsingPath(fileName, file, { Overwrite: false });

    // Get the uploaded file's list item via its server-relative URL
    const fileServerRelUrl = `${sectionPath}/${fileName}`;
    const listItem = await sp.web
      .getFileByServerRelativePath(fileServerRelUrl)
      .getItem();

    // Explicitly construct the update object to ensure property names are correct
    const updateData: any = {
      IsDelete: false,
      ActualDeclarationId: meta.actualDeclarationId,
      LandLordId: meta.landLordId ?? null,
      Section80CId: meta.section80CId ?? null,
      Section80DId: meta.section80DId ?? null,
    };

    await listItem.update(updateData);
  } catch (err) {
    await handleError(err, `Uploading IT document for ${sectionType}`);
    throw err;
  }
};

/** Returns a yyyyMMddHHmmss timestamp string (local time). */
const buildTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
};

/** Strips characters that are invalid in SharePoint folder names. */
const sanitizeFolderName = (name: string): string =>
  name.replace(/[#%*:<>?/\\|"]/g, "_").trim();

/**
 * Fetch non-deleted files from the IT_Documents library for a given Actual
 * Declaration, optionally filtered by row-level lookup columns.
 *
 * @param actualDeclarationId - Numeric ID of the IT_Actual_Declarations item.
 * @param filter.landLordId   - Filter to a specific landlord row.
 * @param filter.section80CId - Filter to a specific 80C row.
 * @param filter.section80DId - Filter to a specific 80D row.
 */
export const getITDocuments = async (
  actualDeclarationId: number,
  filter?: {
    landLordId?: number;
    section80CId?: number;
    section80DId?: number;
  },
): Promise<any[]> => {
  const sp = getSP();
  try {
    let filterStr = `ActualDeclarationId eq ${actualDeclarationId} and (IsDelete ne 1 or IsDelete eq null)`;

    if (filter?.landLordId !== undefined) {
      filterStr += ` and LandLordId eq ${filter.landLordId}`;
    }
    if (filter?.section80CId !== undefined) {
      filterStr += ` and Section80CId eq ${filter.section80CId}`;
    }
    if (filter?.section80DId !== undefined) {
      filterStr += ` and Section80DId eq ${filter.section80DId}`;
    }

    return await sp.web.lists
      .getByTitle(LIST_NAMES.IT_DOCUMENTS)
      .items.select(
        "Id",
        "FileLeafRef",
        "FileRef",
        "Created",
        "ActualDeclarationId",
        "LandLordId",
        "Section80CId",
        "Section80DId",
      )
      .filter(filterStr)
      .orderBy("Id", false)
      .top(500)();
  } catch (err) {
    await handleError(
      err,
      `Fetching IT documents for declaration ${actualDeclarationId}`,
    );
    return [];
  }
};

/**
 * Downloads all attachments for a specific Actual Declaration as a single ZIP file.
 *
 * @param declarationId - Numeric ID of the Actual Declaration.
 * @param fy            - Financial Year (for filename).
 * @param empCode       - Employee Code (for filename).
 */
export const downloadAttachmentsAsZip = async (
  declarationId: number,
  fy: string,
  empCode: string,
): Promise<void> => {
  const sp = getSP();
  try {
    // 1. Fetch all documents for this declaration
    const docs = await getITDocuments(declarationId);
    if (docs.length === 0) {
      throw new Error("No attachments found for this declaration.");
    }

    const zip = new JSZip();

    // 2. Fetch file blobs and add to ZIP
    const fetchPromises = docs.map(async (doc) => {
      const fileContext = await sp.web
        .getFileByServerRelativePath(doc.FileRef)
        .getBlob();
      // We use FileLeafRef as the name in the ZIP
      zip.file(doc.FileLeafRef, fileContext);
    });

    await Promise.all(fetchPromises);

    // 3. Generate and save the ZIP
    const content = await zip.generateAsync({ type: "blob" });
    const zipName = `${fy}-${empCode}.zip`.replace(/\s+/g, "_");
    saveAs(content, zipName);
  } catch (err) {
    await handleError(err, "Downloading attachments as ZIP");
    throw err;
  }
};

// ─── Generic CRUD Helpers ──────────────────────────────────────────────────

/**
 * Fetch all active items from a list (where IsDelete is false/null/not 1).
 */
export const getListItems = async (
  listName: string,
  extraFilter?: string,
): Promise<any[]> => {
  const sp = getSP();
  try {
    const filterQuery = extraFilter
      ? `IsDelete ne 1 and (${extraFilter})`
      : "IsDelete ne 1";
    // Note: Assuming the internal name is IsDelete. If it uses Yes/No, it might be 0/1.
    return await sp.web.lists
      .getByTitle(listName)
      .items.filter(filterQuery)
      .orderBy("ID", false)
      .top(5000)();
  } catch (err) {
    await handleError(err, `Fetching items from ${listName}`);
    return [];
  }
};

/**
 * Add a new item to a list.
 */
export const addListItem = async (
  listName: string,
  item: Record<string, any>,
): Promise<any> => {
  const sp = getSP();
  try {
    const res = await sp.web.lists.getByTitle(listName).items.add({
      ...item,
      IsDelete: false,
    });
    return res;
  } catch (err) {
    await handleError(err, `Adding item to ${listName}`);
    throw err;
  }
};

/**
 * Update an existing list item.
 */
export const updateListItem = async (
  listName: string,
  id: number,
  item: Record<string, any>,
): Promise<void> => {
  const sp = getSP();
  try {
    await sp.web.lists.getByTitle(listName).items.getById(id).update(item);
  } catch (err) {
    await handleError(err, `Updating item ${id} in ${listName}`);
    throw err;
  }
};

/**
 * Soft delete an existing list item by setting IsDelete to true.
 */
export const deleteListItem = async (
  listName: string,
  id: number,
): Promise<void> => {
  const sp = getSP();
  try {
    await sp.web.lists
      .getByTitle(listName)
      .items.getById(id)
      .update({ IsDelete: true });
  } catch (err) {
    await handleError(err, `Soft deleting item ${id} in ${listName}`);
    throw err;
  }
};
/**
 * Add multiple items to a list using PnPJS batching for better performance.
 *
 * @param listName - Internal name of the list.
 * @param items    - Array of records to add.
 * @param batchSize - Number of items per batch (default: 100).
 */
export const addListItemsBatch = async (
  listName: string,
  items: Record<string, any>[],
  batchSize = 100,
): Promise<void> => {
  const sp = getSP();

  // Split into chunks of batchSize
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const [batchedSP, execute] = sp.batched();

    chunk.forEach((item) => {
      batchedSP.web.lists.getByTitle(listName).items.add({
        ...item,
        IsDelete: false,
      });
    });

    await execute();
  }
};

/**
 * Update multiple items in a list using PnPJS batching.
 *
 * @param listName - Internal name of the list.
 * @param updates  - Array of objects containing { id: number, data: Record<string, any> }.
 * @param batchSize - Number of items per batch (default: 100).
 */
export const updateListItemsBatch = async (
  listName: string,
  updates: { id: number; data: Record<string, any> }[],
  batchSize = 100,
): Promise<void> => {
  const sp = getSP();

  for (let i = 0; i < updates.length; i += batchSize) {
    const chunk = updates.slice(i, i + batchSize);
    const [batchedSP, execute] = sp.batched();

    chunk.forEach((update) => {
      batchedSP.web.lists
        .getByTitle(listName)
        .items.getById(update.id)
        .update(update.data);
    });
    await execute();
  }
};

/**
 * Higher-level utility to upsert (Add/Update/Delete) items in a secondary list
 * based on a lookup ID to the main declaration.
 *
 * @param listName - Secondary list name
 * @param mainId - ID of the Planned Declaration
 * @param stateItems - Current items in the UI state
 * @param mappingFn - Function to map state item to SP internal fields
 */
export const upsertRelatedListBatch = async (
  listName: string,
  mainId: number,
  stateItems: any[],
  mappingFn: (item: any) => Record<string, any>,
  lookupColumn: string = "PlannedDeclarationId",
): Promise<void> => {
  const sp = getSP();
  try {
    // 1. Fetch current items in SP for this mainId
    const existingItems = await sp.web.lists
      .getByTitle(listName)
      .items.filter(
        `${lookupColumn} eq ${mainId} and (IsDelete ne 1 or IsDelete eq null)`,
      )();

    const [batchedSP, execute] = sp.batched();

    // 2. Determine Add vs Update without soft-deleting
    stateItems.forEach((item, index) => {
      const data: Record<string, any> = {
        ...mappingFn(item),
        [lookupColumn]: mainId,
      };

      let targetId = item.Id || item.ID;

      // Smart matching if ID is absent
      if (!targetId && existingItems.length > 0) {
        if (data.TypeOfInvestmentId) {
          const match = existingItems.find(
            (ex) => ex.TypeOfInvestmentId === data.TypeOfInvestmentId,
          );
          if (match) targetId = match.Id;
        } else if (existingItems[index]) {
          targetId = existingItems[index].Id;
        }
      }

      if (targetId) {
        batchedSP.web.lists
          .getByTitle(listName)
          .items.getById(targetId)
          .update(data);
      } else {
        batchedSP.web.lists.getByTitle(listName).items.add(data);
      }
    });

    await execute();
  } catch (err) {
    await handleError(err, `Upserting batch for ${listName}`);
    throw err;
  }
};

/**
 * Fetch the draft or released planned declaration for a user.
 */
export const getMyPlannedDeclaration = async (
  email: string,
  financialYear: string,
): Promise<any | null> => {
  const sp = getSP();
  try {
    const items = await sp.web.lists
      .getByTitle(LIST_NAMES.PLANNED_DECLARATION)
      .items.filter(
        `EmployeeEmail eq '${email}' and FinancialYear eq '${financialYear}' and IsDelete ne 1`,
      )
      .select("*")
      .orderBy("Id", false)();

    return items[0] || null;
  } catch (err) {
    await handleError(err, "Fetching my planned declaration");
    return null;
  }
};

/**
 * Fetch the actual declaration for a user for a specific financial year.
 */
export const getMyActualDeclaration = async (
  email: string,
  financialYear: string,
): Promise<any | null> => {
  const sp = getSP();
  try {
    const items = await sp.web.lists
      .getByTitle(LIST_NAMES.ACTUAL_DECLARATION)
      .items.filter(
        `EmployeeEmail eq '${email}' and FinancialYear eq '${financialYear}' and IsDelete ne 1`,
      )
      .select("*")
      .orderBy("Id", false)();

    return items[0] || null;
  } catch (err) {
    await handleError(err, "Fetching my actual declaration");
    return null;
  }
};

/**
 * Fetch all related items from a secondary list linked by PlannedDeclarationId.
 */
export const getRelatedListItems = async (
  listName: string,
  mainId: number,
  lookupColumn: string = "PlannedDeclarationId",
): Promise<any[]> => {
  const sp = getSP();
  try {
    return await sp.web.lists
      .getByTitle(listName)
      .items.filter(
        `${lookupColumn} eq ${mainId} and (IsDelete ne 1 or IsDelete eq null)`,
      )();
  } catch (err) {
    await handleError(err, `Fetching related items from ${listName}`);
    return [];
  }
};

/**
 * Fetch choices attached to a specific list's choice field.
 */
export const getFieldChoices = async (
  listName: string,
  internalFieldName: string,
): Promise<string[]> => {
  const sp = getSP();
  try {
    const field = await sp.web.lists
      .getByTitle(listName)
      .fields.getByInternalNameOrTitle(internalFieldName)();

    // SharePoint returns choices under the 'Choices' property for Choice fields
    return field.Choices || [];
  } catch (err) {
    await handleError(
      err,
      `Fetching choices for ${internalFieldName} in ${listName}`,
    );
    return [];
  }
};
