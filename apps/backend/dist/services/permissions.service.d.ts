declare class PermissionsService {
    getPermissions(): Promise<{
        id: string;
        module: string;
        action: string;
        slug: string;
        name: string;
        description: string | null;
    }[]>;
    getPermissionsGrouped(): Promise<{
        module: string;
        moduleLabel: string;
        permissions: {
            id: string;
            module: string;
            action: string;
            slug: string;
            name: string;
            description: string | null;
        }[];
    }[]>;
}
declare const _default: PermissionsService;
export default _default;
//# sourceMappingURL=permissions.service.d.ts.map