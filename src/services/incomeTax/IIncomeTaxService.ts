import { IIncomeTaxItem } from '../../common/models';

/**
 * Interface for IncomeTax service operations.
 * Implement this contract for production and mock services.
 */
export interface IIncomeTaxService {
    /**
     * Retrieves all income tax records.
     */
    getIncomeTaxItems(): Promise<IIncomeTaxItem[]>;

    /**
     * Retrieves a single income tax record by ID.
     * @param id - The list item ID.
     */
    getIncomeTaxItemById(id: number): Promise<IIncomeTaxItem>;

    /**
     * Creates a new income tax record.
     * @param item - The item data to create.
     */
    createIncomeTaxItem(item: Partial<IIncomeTaxItem>): Promise<IIncomeTaxItem>;

    /**
     * Updates an existing income tax record.
     * @param id - The list item ID.
     * @param item - The fields to update.
     */
    updateIncomeTaxItem(id: number, item: Partial<IIncomeTaxItem>): Promise<void>;

    /**
     * Deletes an income tax record by ID.
     * @param id - The list item ID.
     */
    deleteIncomeTaxItem(id: number): Promise<void>;
}
