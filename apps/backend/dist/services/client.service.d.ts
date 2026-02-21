/**
 * Client Service
 * Business logic for client management
 */
import { CreateClientDTO, UpdateClientDTO, ClientFilters, ClientResponse } from '../types/client.types';
export declare class ClientService {
    createClient(data: CreateClientDTO, userId: string): Promise<ClientResponse>;
    getClients(filters?: ClientFilters): Promise<ClientResponse[]>;
    getClientById(id: string): Promise<ClientResponse>;
    updateClient(id: string, data: UpdateClientDTO, userId: string): Promise<ClientResponse>;
    deleteClient(id: string, userId: string): Promise<void>;
    private isValidEmail;
}
declare const _default: ClientService;
export default _default;
//# sourceMappingURL=client.service.d.ts.map