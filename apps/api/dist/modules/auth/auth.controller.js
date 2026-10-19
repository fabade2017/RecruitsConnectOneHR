"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
function cookie_opts(maxAgeSec) {
    const secure = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure,
        sameSite: secure ? 'none' : 'lax',
        path: '/',
        maxAge: maxAgeSec * 1000,
    };
}
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async login(body, res) {
        const ac = body.org_acronym || body.acronym || body.organizationAcronym;
        const result = await this.auth.login(body.email, body.password, ac);
        // HttpOnly cookies (cross-site for QServers→Render) + body tokens for SPA Bearer fallback
        res.cookie('onehr_access', result.access_token, cookie_opts(60 * 15));
        res.cookie('onehr_refresh', result.refresh_token, cookie_opts(60 * 60 * 24 * 7));
        return result;
    }
    async refresh(body, req, res) {
        // Prefer body token; fall back to HttpOnly cookie
        let token = body?.refresh_token;
        if (!token && req.headers?.cookie) {
            const m = String(req.headers.cookie).match(/(?:^|;\s*)onehr_refresh=([^;]+)/);
            if (m?.[1])
                token = decodeURIComponent(m[1]);
        }
        const result = await this.auth.refresh(token || '');
        res.cookie('onehr_access', result.access_token, cookie_opts(60 * 15));
        return result;
    }
    logout(res) {
        res.clearCookie('onehr_access', { path: '/' });
        res.clearCookie('onehr_refresh', { path: '/' });
        return { ok: true };
    }
    registerDevice(body, req) {
        return this.auth.registerDevice(req.user.sub, body);
    }
    async me(req) {
        return this.auth.me(req.user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login - requires email, password and organization acronym' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['email', 'password', 'acronym'],
            properties: {
                email: { type: 'string', example: 'sample.admin@example.com' },
                password: { type: 'string', example: 'Sample@123' },
                acronym: { type: 'string', example: 'SAMPLE', description: 'Organization acronym (also accepts org_acronym / organizationAcronym)' },
                org_acronym: { type: 'string', example: 'SAMPLE' },
                organizationAcronym: { type: 'string', example: 'SAMPLE' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', required: ['refresh_token'], properties: { refresh_token: { type: 'string', example: 'eyJ...' } } } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('device/register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
