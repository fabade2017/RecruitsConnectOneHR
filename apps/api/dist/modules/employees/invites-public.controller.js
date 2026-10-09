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
exports.InvitesPublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let InvitesPublicController = class InvitesPublicController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    validate(token) {
        return this.svc.getInviteByToken(token);
    }
    accept(token, dto) {
        return this.svc.acceptInvite(token, dto);
    }
};
exports.InvitesPublicController = InvitesPublicController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)(':token'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate a staff invite token and return the prefilled profile form data' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvitesPublicController.prototype, "validate", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)(':token/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a staff invite — create the profile and set a password' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', required: ['password'], properties: {
                password: { type: 'string', example: 'NewPass@123' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                phone: { type: 'string' },
            } } }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvitesPublicController.prototype, "accept", null);
exports.InvitesPublicController = InvitesPublicController = __decorate([
    (0, swagger_1.ApiTags)('staff-invites'),
    (0, common_1.Controller)('staff-invites'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], InvitesPublicController);
