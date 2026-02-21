export declare const authService: {
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            assignedRole: {
                id: string;
                name: string;
                slug: string;
                color: string | null;
            } | null;
            permissions: string[];
        };
    }>;
    register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        roleId?: string;
    }): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            assignedRole: {
                id: string;
                name: string;
                slug: string;
                color: string | null;
            } | null;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        assignedRole: {
            id: string;
            name: string;
            slug: string;
            color: string | null;
        } | null;
        permissions: string[];
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map