"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolvePermissions(user) {
        // Custom role via customRoleId -> permissions JSON
        if (user.customRoleId) {
            const cr = await this.prisma.roleDefinition.findUnique({ where: { id: user.customRoleId } });
            if (cr) {
                try {
                    const perms = typeof cr.permissions === 'string' ? JSON.parse(cr.permissions) : cr.permissions;
                    if (Array.isArray(perms) && perms.length)
                        return perms;
                }
                catch { }
            }
        }
        // Try by slug (custom roles reuse slug)
        const bySlug = await this.prisma.roleDefinition.findFirst({ where: { slug: user.role } });
        if (bySlug) {
            try {
                const perms = typeof bySlug.permissions === 'string' ? JSON.parse(bySlug.permissions) : bySlug.permissions;
                if (Array.isArray(perms) && perms.length)
                    return perms;
            }
            catch { }
        }
        // Fallback to system matrix
        const { getSystemPermissions } = await Promise.resolve().then(() => __importStar(require('../../common/guards/rbac.guard')));
        return getSystemPermissions(user.role);
    }
    async login(email, password, orgAcronym) {
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const org = await this.prisma.organization.findUnique({ where: { id: user.organizationId } });
        if (orgAcronym && org?.acronym !== orgAcronym)
            throw new common_1.UnauthorizedException('Organization mismatch');
        const employee = await this.prisma.employee.findUnique({ where: { userId: user.id }, select: { id: true } });
        const permissions = await this.resolvePermissions(user);
        const payload = { sub: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, org_acronym: org?.acronym, employeeId: employee?.id || null, permissions };
        const access_token = jwt.sign(payload, (process.env.JWT_SECRET || 'change-me-32-chars-minimum-secret-for-dev'), { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') });
        const refresh_token = jwt.sign({ sub: user.id, type: 'refresh' }, (process.env.JWT_REFRESH_SECRET || 'change-me-refresh-32-chars-minimum'), { expiresIn: '7d' });
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { access_token, refresh_token, user: { id: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, permissions } };
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const org = await this.prisma.organization.findUnique({ where: { id: user.organizationId } });
        const employee = await this.prisma.employee.findUnique({ where: { userId: user.id }, select: { id: true } });
        const permissions = await this.resolvePermissions(user);
        return { user: { id: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, org_acronym: org?.acronym, employeeId: employee?.id || null, permissions } };
    }
    async refresh(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'change-me-refresh-32-chars');
            const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
            if (!user)
                throw new common_1.UnauthorizedException('Invalid refresh');
            const employee = await this.prisma.employee.findUnique({ where: { userId: user.id }, select: { id: true } });
            const permissions = await this.resolvePermissions(user);
            const payload = { sub: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, employeeId: employee?.id || null, permissions };
            const access_token = jwt.sign(payload, (process.env.JWT_SECRET || 'change-me-32-chars-minimum-secret-for-dev'), { expiresIn: '15m' });
            return { access_token };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async registerDevice(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return this.prisma.device.create({
            data: {
                organizationId: user.organizationId,
                employeeId: (await this.prisma.employee.findUnique({ where: { userId } }))?.id,
                deviceFingerprint: dto.device_fingerprint,
                deviceType: dto.device_type,
                deviceName: dto.device_name,
                isAuthorized: true,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
