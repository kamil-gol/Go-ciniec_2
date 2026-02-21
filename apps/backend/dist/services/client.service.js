/**
 * Client Service
 * Business logic for client management
 */
import { prisma } from '@/lib/prisma';
import { logChange, diffObjects } from '../utils/audit-logger';
export class ClientService {
    async createClient(data, userId) {
        if (data.email && !this.isValidEmail(data.email)) {
            throw new Error('Invalid email format');
        }
        if (!data.phone) {
            throw new Error('Phone number is required');
        }
        const phoneDigits = data.phone.replace(/\D/g, '');
        if (phoneDigits.length < 9) {
            throw new Error('Phone number must contain at least 9 digits');
        }
        const existingClient = await prisma.client.findFirst({
            where: {
                phone: data.phone,
                firstName: data.firstName,
                lastName: data.lastName
            }
        });
        if (existingClient) {
            throw new Error(`Klient ${data.firstName} ${data.lastName} z numerem ${data.phone} już istnieje`);
        }
        const client = await prisma.client.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email?.trim() || null,
                phone: data.phone.trim(),
                notes: data.notes?.trim() || null
            }
        });
        // Audit log
        await logChange({
            userId,
            action: 'CREATE',
            entityType: 'CLIENT',
            entityId: client.id,
            details: {
                description: `Utworzono klienta: ${client.firstName} ${client.lastName}`,
                data: {
                    firstName: client.firstName,
                    lastName: client.lastName,
                    email: client.email,
                    phone: client.phone
                }
            }
        });
        return client;
    }
    async getClients(filters) {
        const where = {};
        if (filters?.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        const clients = await prisma.client.findMany({
            where,
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
        });
        return clients;
    }
    async getClientById(id) {
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                reservations: {
                    take: 10,
                    orderBy: { startDateTime: 'desc' },
                    select: {
                        id: true,
                        startDateTime: true,
                        endDateTime: true,
                        guests: true,
                        totalPrice: true,
                        status: true,
                        eventType: { select: { id: true, name: true } },
                        hall: { select: { id: true, name: true } }
                    }
                },
                _count: {
                    select: { reservations: true }
                }
            }
        });
        if (!client) {
            throw new Error('Client not found');
        }
        return client;
    }
    async updateClient(id, data, userId) {
        const existingClient = await prisma.client.findUnique({ where: { id } });
        if (!existingClient) {
            throw new Error('Client not found');
        }
        if (data.email && !this.isValidEmail(data.email)) {
            throw new Error('Invalid email format');
        }
        if (data.phone) {
            const phoneDigits = data.phone.replace(/\D/g, '');
            if (phoneDigits.length < 9) {
                throw new Error('Phone number must contain at least 9 digits');
            }
            const firstName = data.firstName || existingClient.firstName;
            const lastName = data.lastName || existingClient.lastName;
            const clientWithSameDetails = await prisma.client.findFirst({
                where: {
                    phone: data.phone,
                    firstName: firstName,
                    lastName: lastName,
                    id: { not: id }
                }
            });
            if (clientWithSameDetails) {
                throw new Error(`Klient ${firstName} ${lastName} z numerem ${data.phone} już istnieje`);
            }
        }
        const updateData = {};
        if (data.firstName)
            updateData.firstName = data.firstName.trim();
        if (data.lastName)
            updateData.lastName = data.lastName.trim();
        if (data.email !== undefined)
            updateData.email = data.email?.trim() || null;
        if (data.phone !== undefined)
            updateData.phone = data.phone?.trim() || null;
        if (data.notes !== undefined)
            updateData.notes = data.notes?.trim() || null;
        const client = await prisma.client.update({
            where: { id },
            data: updateData
        });
        // Audit log
        const changes = diffObjects(existingClient, client);
        if (Object.keys(changes).length > 0) {
            await logChange({
                userId,
                action: 'UPDATE',
                entityType: 'CLIENT',
                entityId: client.id,
                details: {
                    description: `Zaktualizowano klienta: ${client.firstName} ${client.lastName}`,
                    changes
                }
            });
        }
        return client;
    }
    async deleteClient(id, userId) {
        const existingClient = await prisma.client.findUnique({ where: { id } });
        if (!existingClient) {
            throw new Error('Client not found');
        }
        const reservationCount = await prisma.reservation.count({
            where: { clientId: id }
        });
        if (reservationCount > 0) {
            throw new Error('Cannot delete client with existing reservations');
        }
        await prisma.client.delete({ where: { id } });
        // Audit log
        await logChange({
            userId,
            action: 'DELETE',
            entityType: 'CLIENT',
            entityId: id,
            details: {
                description: `Usunięto klienta: ${existingClient.firstName} ${existingClient.lastName}`,
                deletedData: {
                    firstName: existingClient.firstName,
                    lastName: existingClient.lastName,
                    email: existingClient.email,
                    phone: existingClient.phone
                }
            }
        });
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
export default new ClientService();
//# sourceMappingURL=client.service.js.map