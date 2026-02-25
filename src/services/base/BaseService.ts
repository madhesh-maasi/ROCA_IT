import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';

export abstract class BaseService {
    protected spHttpClient: SPHttpClient;
    protected siteUrl: string;

    constructor(spHttpClient: SPHttpClient, siteUrl: string) {
        this.spHttpClient = spHttpClient;
        this.siteUrl = siteUrl;
    }

    /**
     * Performs a GET request to the specified endpoint.
     * @param endpoint - The REST API endpoint (relative to site URL).
     * @returns Parsed JSON response of type T.
     */
    protected async get<T>(endpoint: string): Promise<T> {
        const url = `${this.siteUrl}${endpoint}`;
        const response: SPHttpClientResponse = await this.spHttpClient.get(
            url,
            SPHttpClient.configurations.v1
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GET ${url} failed (${response.status}): ${errorText}`);
        }

        return response.json() as Promise<T>;
    }

    /**
     * Performs a POST request to the specified endpoint.
     * @param endpoint - The REST API endpoint (relative to site URL).
     * @param body - The request body as a plain object.
     * @returns Parsed JSON response of type T.
     */
    protected async post<T>(endpoint: string, body: unknown): Promise<T> {
        const url = `${this.siteUrl}${endpoint}`;
        const options: ISPHttpClientOptions = {
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json;odata=verbose',
                'Accept': 'application/json;odata=verbose'
            }
        };

        const response: SPHttpClientResponse = await this.spHttpClient.post(
            url,
            SPHttpClient.configurations.v1,
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`POST ${url} failed (${response.status}): ${errorText}`);
        }

        return response.json() as Promise<T>;
    }

    /**
     * Performs a PATCH (update) request to the specified endpoint.
     * @param endpoint - The REST API endpoint (relative to site URL).
     * @param body - The request body as a plain object.
     * @param etag - The ETag for concurrency control (use '*' to force overwrite).
     */
    protected async patch(endpoint: string, body: unknown, etag: string = '*'): Promise<void> {
        const url = `${this.siteUrl}${endpoint}`;
        const options: ISPHttpClientOptions = {
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json;odata=verbose',
                'Accept': 'application/json;odata=verbose',
                'IF-MATCH': etag,
                'X-HTTP-Method': 'MERGE'
            }
        };

        const response: SPHttpClientResponse = await this.spHttpClient.post(
            url,
            SPHttpClient.configurations.v1,
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`PATCH ${url} failed (${response.status}): ${errorText}`);
        }
    }

    /**
     * Performs a DELETE request to the specified endpoint.
     * @param endpoint - The REST API endpoint (relative to site URL).
     * @param etag - The ETag for concurrency control (use '*' to force delete).
     */
    protected async delete(endpoint: string, etag: string = '*'): Promise<void> {
        const url = `${this.siteUrl}${endpoint}`;
        const options: ISPHttpClientOptions = {
            headers: {
                'Accept': 'application/json;odata=verbose',
                'IF-MATCH': etag,
                'X-HTTP-Method': 'DELETE'
            }
        };

        const response: SPHttpClientResponse = await this.spHttpClient.post(
            url,
            SPHttpClient.configurations.v1,
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DELETE ${url} failed (${response.status}): ${errorText}`);
        }
    }
}
