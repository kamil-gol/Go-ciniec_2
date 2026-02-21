import permissionsService from '@services/permissions.service';
export class PermissionsController {
    async getPermissions(_req, res) {
        const permissions = await permissionsService.getPermissions();
        res.json({ success: true, data: permissions });
    }
    async getPermissionsGrouped(_req, res) {
        const groups = await permissionsService.getPermissionsGrouped();
        res.json({ success: true, data: groups });
    }
}
export default new PermissionsController();
//# sourceMappingURL=permissions.controller.js.map