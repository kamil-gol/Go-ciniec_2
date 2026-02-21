/**
 * ClientController — Unit Tests
 */
jest.mock('../../../services/client.service', () => ({
    __esModule: true,
    default: {
        createClient: jest.fn(),
        getClients: jest.fn(),
        getClientById: jest.fn(),
        updateClient: jest.fn(),
        deleteClient: jest.fn(),
    },
}));
import { ClientController } from '../../../controllers/client.controller';
import clientService from '../../../services/client.service';
const controller = new ClientController();
const svc = clientService;
const req = (overrides = {}) => ({
    body: {}, params: {}, query: {}, user: { id: 1 },
    ...overrides,
});
const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};
beforeEach(() => jest.clearAllMocks());
describe('ClientController', () => {
    // ======= createClient =======
    describe('createClient()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.createClient(req({ user: undefined, body: { firstName: 'Jan', lastName: 'K', phone: '+48123' } }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw 400 when required fields missing', async () => {
            await expect(controller.createClient(req({ body: { firstName: 'Jan' } }), res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should throw 400 on invalid email', async () => {
            await expect(controller.createClient(req({ body: { firstName: 'Jan', lastName: 'K', phone: '+48123', email: 'bad' } }), res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 201 on valid creation', async () => {
            svc.createClient.mockResolvedValue({ id: 'c-1', firstName: 'Jan' });
            const response = res();
            await controller.createClient(req({ body: { firstName: 'Jan', lastName: 'Kowalski', phone: '+48123456789' } }), response);
            expect(response.status).toHaveBeenCalledWith(201);
        });
    });
    // ======= getClients =======
    describe('getClients()', () => {
        it('should return clients with count', async () => {
            svc.getClients.mockResolvedValue([{ id: 'c-1' }, { id: 'c-2' }]);
            const response = res();
            await controller.getClients(req({ query: { search: 'Jan' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 2 }));
        });
    });
    // ======= getClientById =======
    describe('getClientById()', () => {
        it('should return client', async () => {
            svc.getClientById.mockResolvedValue({ id: 'c-1', firstName: 'Jan' });
            const response = res();
            await controller.getClientById(req({ params: { id: 'c-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
        it('should throw 404 when not found', async () => {
            svc.getClientById.mockResolvedValue(null);
            await expect(controller.getClientById(req({ params: { id: 'c-x' } }), res()))
                .rejects.toMatchObject({ statusCode: 404 });
        });
    });
    // ======= updateClient =======
    describe('updateClient()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.updateClient(req({ user: undefined, params: { id: 'c-1' } }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should throw 400 on invalid email', async () => {
            await expect(controller.updateClient(req({ params: { id: 'c-1' }, body: { email: 'invalid' } }), res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 200 on success', async () => {
            svc.updateClient.mockResolvedValue({ id: 'c-1', firstName: 'Updated' });
            const response = res();
            await controller.updateClient(req({ params: { id: 'c-1' }, body: { firstName: 'Updated' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
    // ======= deleteClient =======
    describe('deleteClient()', () => {
        it('should throw 401 when no user', async () => {
            await expect(controller.deleteClient(req({ user: undefined, params: { id: 'c-1' } }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 200 on success', async () => {
            svc.deleteClient.mockResolvedValue(undefined);
            const response = res();
            await controller.deleteClient(req({ params: { id: 'c-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=client.controller.test.js.map