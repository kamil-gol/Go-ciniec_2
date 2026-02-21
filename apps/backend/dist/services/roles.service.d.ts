declare class RolesService {
    getRoles(): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        color: string | null;
        isSystem: boolean;
        isActive: boolean;
        usersCount: number;
        permissions: {
            id: string;
            module: string;
            action: string;
            slug: string;
            name: string;
            description: string | null;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getRoleById(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        color: string | null;
        isSystem: boolean;
        isActive: boolean;
        usersCount: number;
        permissions: {
            id: string;
            module: string;
            action: string;
            slug: string;
            name: string;
            description: string | null;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    createRole(data: {
        name: string;
        slug: string;
        description?: string;
        color?: string;
        permissionIds: string[];
    }, actorId: string): Promise<{
        id: any;
        name: any;
        slug: any;
        description: any;
        color: any;
        isSystem: any;
        isActive: any;
        usersCount: any;
        permissions: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateRole(id: string, data: {
        name?: string;
        description?: string;
        color?: string;
        isActive?: boolean;
    }, actorId: string): Promise<{
        id: any;
        name: any;
        slug: any;
        description: any;
        color: any;
        isSystem: any;
        isActive: any;
        usersCount: any;
        permissions: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateRolePermissions(id: string, permissionIds: string[], actorId: string): Promise<{
        id: any;
        name: any;
        slug: any;
        description: any;
        color: any;
        isSystem: any;
        isActive: any;
        usersCount: any;
        permissions: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteRole(id: string, actorId: string): Promise<void>;
    private formatRole;
}
declare const _default: RolesService;
export default _default;
//# sourceMappingURL=roles.service.d.ts.map