// Accepts any UUID-shaped string (v1-v8, nil UUID, etc.)
// Goal: block garbage like "not-a-uuid" before it hits Prisma
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(...paramNames) {
    return (req, res, next) => {
        for (const param of paramNames) {
            const value = req.params[param];
            if (value && !UUID_REGEX.test(value)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid ID format for parameter '${param}'`,
                });
                return;
            }
        }
        next();
    };
}
//# sourceMappingURL=validateUUID.js.map