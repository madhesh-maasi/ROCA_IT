import { spfi, SPFI } from "@pnp/sp";
import { SPFx, Web } from "@pnp/sp/presets/all";
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
  orderBy?: string,
  ascending = true,
): Promise<T[]> => {
  const sp = getSP();
  let query = sp.web.lists.getByTitle(listName).items;

  if (select?.length) {
    query = query.select(...select) as typeof query;
  }
  if (orderBy) {
    query = query.orderBy(orderBy, ascending) as typeof query;
  }

  return query<T[]>();
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
      .items.select("*")
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
 * Fetch all users in the site's Associated Members group.
 */
export const getSiteMembersGroupUsers = async (): Promise<any[]> => {
  const sp = getSP();
  try {
    return await sp.web.associatedMemberGroup.users();
  } catch (err) {
    await handleError(err, "Fetching site members group users");
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
      .select("ID", "FileLeafRef", "FileRef")();

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

// ─── Generic CRUD Helpers ──────────────────────────────────────────────────

/**
 * Fetch all active items from a list (where IsDelete is false/null/not 1).
 */
export const getListItems = async (listName: string): Promise<any[]> => {
  const sp = getSP();
  try {
    // Note: Assuming the internal name is IsDelete. If it uses Yes/No, it might be 0/1.
    return await sp.web.lists
      .getByTitle(listName)
      .items.filter("IsDelete ne 1")
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
      IsDelete: false, // Explicitly set active
    });
    return res.data;
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
