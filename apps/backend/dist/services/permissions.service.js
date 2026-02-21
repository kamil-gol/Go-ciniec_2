/**
 * Permissions Service — List all permissions (grouped by module)
 */
import { prisma } from '@/lib/prisma';
import { MODULE_LABELS } from '@/constants/permissions';
class PermissionsService {
    async getPermissions() {
        const permissions = await prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }],
        });
        return permissions.map((p) => ({
            id: p.id,
            module: p.module,
            action: p.action,
            slug: p.slug,
            name: p.name,
            description: p.description,
        }));
    }
    async getPermissionsGrouped() {
        const permissions = await this.getPermissions();
        const grouped = {};
        for (const perm of permissions) {
            if (!grouped[perm.module]) {
                grouped[perm.module] = {
                    module: perm.module,
                    moduleLabel: MODULE_LABELS[perm.module] || perm.module,
                    permissions: [],
                };
            }
            grouped[perm.module].permissions.push(perm);
        }
        return Object.values(grouped);
    }
}
export default new PermissionsService();
//# sourceMappingURL=permissions.service.js.map