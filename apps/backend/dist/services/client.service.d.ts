/**
 * Client Service
 * Business logic for client management
 */
import { CreateClientDTO, UpdateClientDTO, ClientFilters, ClientResponse } from '../types/client.types';
export declare class ClientService {
    /**
     * Create a new client
     */
    createClient(data: CreateClientDTO): Promise<ClientResponse>;
    /**
     * Get all clients with optional filters
     */
    getClients(filters?: ClientFilters): Promise<ClientResponse[]>;
    /**
     * Get client by ID
     */
    getClientById(id: string): Promise<ClientResponse>;
    /**
     * Update client
     */
    updateClient(id: string, data: UpdateClientDTO): Promise<ClientResponse>;
    /**
     * Delete client (hard delete)
     */
    deleteClient(id: string): Promise<void>;
    /**
     * Validate email format
     */
    private isValidEmail;
}
declare const _default: ClientService;
export default _default;
//# sourceMappingURL=client.service.d.ts.map