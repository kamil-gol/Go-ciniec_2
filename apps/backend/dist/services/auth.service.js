import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { validatePassword } from '@utils/password';
import { generateToken } from '@middlewares/auth';
import logger from '@utils/logger';
const prisma = new PrismaClient();
export const authService = {
    async login(email, password) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        if (!user.isActive) {
            throw new Error('User account is inactive');
        }
        const token = generateToken(user);
        logger.info(`User logged in: ${user.email}`);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    },
    async register(data) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        validatePassword(data.password);
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'EMPLOYEE',
            },
        });
        const token = generateToken(user);
        logger.info(`New user registered: ${user.email}`);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    },
};
//# sourceMappingURL=auth.service.js.map