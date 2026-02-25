import { SPHttpClient } from '@microsoft/sp-http';
import { BaseService } from '../base';
import { IIncomeTaxService } from './IIncomeTaxService';
import { IIncomeTaxItem } from '../../common/models';
import { LIST_NAMES } from '../../common/constants';

/**
 * Concrete service for Income Tax CRUD operations against a SharePoint list.
 */
export class IncomeTaxService extends BaseService implements IIncomeTaxService {
    private listName: string;

    constructor(spHttpClient: SPHttpClient, siteUrl: string) {
        super(spHttpClient, siteUrl);
        this.listName = LIST_NAMES.INCOME_TAX;
    }

    private get listEndpoint(): string {
        return `/_api/web/lists/getbytitle('${this.listName}')/items`;
    }

    public async getIncomeTaxItems(): Promise<IIncomeTaxItem[]> {
        const response = await this.get<{ value: IIncomeTaxItem[] }>(this.listEndpoint);
        return response.value;
    }

    public async getIncomeTaxItemById(id: number): Promise<IIncomeTaxItem> {
        const endpoint = `${this.listEndpoint}(${id})`;
        return this.get<IIncomeTaxItem>(endpoint);
    }

    public async createIncomeTaxItem(item: Partial<IIncomeTaxItem>): Promise<IIncomeTaxItem> {
        return this.post<IIncomeTaxItem>(this.listEndpoint, {
            '__metadata': { 'type': `SP.Data.${this.listName.replace(/\s/g, '_x0020_')}ListItem` },
            ...item
        });
    }

    public async updateIncomeTaxItem(id: number, item: Partial<IIncomeTaxItem>): Promise<void> {
        const endpoint = `${this.listEndpoint}(${id})`;
        await this.patch(endpoint, {
            '__metadata': { 'type': `SP.Data.${this.listName.replace(/\s/g, '_x0020_')}ListItem` },
            ...item
        });
    }

    public async deleteIncomeTaxItem(id: number): Promise<void> {
        const endpoint = `${this.listEndpoint}(${id})`;
        await this.delete(endpoint);
    }
}
