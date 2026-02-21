interface UsersQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
declare class UsersService {
    getUsers(params: UsersQueryParams): Promise<{
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isActive: boolean;
            lastLoginAt: Date | null;
            role: {
                id: string;
                name: string;
                slug: string;
                color: string | null;
            } | null;
            legacyRole: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserById(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        role: {
            id: string;
            name: string;
            slug: string;
            color: string | null;
        } | null;
        permissions: string[];
        legacyRole: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createUser(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        roleId: string;
    }, actorId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        role: {
            id: string;
            name: string;
            slug: string;
            color: string | null;
        } | null;
        createdAt: Date;
    }>;
    updateUser(id: string, data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        roleId?: string;
        isActive?: boolean;
    }, actorId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        role: {
            id: string;
            name: string;
            slug: string;
            color: string | null;
        } | null;
        updatedAt: Date;
    }>;
    changePassword(id: string, newPassword: string, actorId: string): Promise<void>;
    toggleActive(id: string, actorId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        role: {
            id: string;
            name: string;
            slug: string;
            color: string | null;
        } | null;
        legacyRole: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteUser(id: string, actorId: string): Promise<void>;
}
declare const _default: UsersService;
export default _default;
//# sourceMappingURL=users.service.d.ts.map