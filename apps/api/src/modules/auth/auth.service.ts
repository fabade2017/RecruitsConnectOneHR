import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private async resolvePermissions(user: any): Promise<string[]> {
    // Custom role via customRoleId -> permissions JSON
    if (user.customRoleId) {
      const cr = await this.prisma.roleDefinition.findUnique({ where: { id: user.customRoleId } });
      if (cr) {
        try {
          const perms = typeof cr.permissions === 'string' ? JSON.parse(cr.permissions as any) : (cr.permissions as any);
          if (Array.isArray(perms) && perms.length) return perms;
        } catch {}
      }
    }
    // Try by slug (custom roles reuse slug)
    const bySlug = await this.prisma.roleDefinition.findFirst({ where: { slug: user.role } });
    if (bySlug) {
      try {
        const perms = typeof bySlug.permissions === 'string' ? JSON.parse(bySlug.permissions as any) : (bySlug.permissions as any);
        if (Array.isArray(perms) && perms.length) return perms;
      } catch {}
    }
    // Fallback to system matrix
    const { getSystemPermissions } = await import('../../common/guards/rbac.guard');
    return getSystemPermissions(user.role);
  }

  async login(email: string, password: string, orgAcronym?: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const org = await this.prisma.organization.findUnique({ where: { id: user.organizationId } });
    if (orgAcronym && org?.acronym !== orgAcronym) throw new UnauthorizedException('Organization mismatch');
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id }, select: { id: true } });
    const permissions = await this.resolvePermissions(user);

    const payload = { sub: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, org_acronym: org?.acronym, employeeId: employee?.id || null, permissions };
    const access_token = jwt.sign(payload, (process.env.JWT_SECRET || 'change-me-32-chars-minimum-secret-for-dev') as string, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any } as any);
    const refresh_token = jwt.sign({ sub: user.id, type: 'refresh' }, (process.env.JWT_REFRESH_SECRET || 'change-me-refresh-32-chars-minimum') as string, { expiresIn: '7d' } as any);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { access_token, refresh_token, user: { id: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, permissions } };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const org = await this.prisma.organization.findUnique({ where: { id: user.organizationId } });
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id }, select: { id: true } });
    const permissions = await this.resolvePermissions(user);
    return { user: { id: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, org_acronym: org?.acronym, employeeId: employee?.id || null, permissions } };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'change-me-refresh-32-chars');
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException('Invalid refresh');
      const employee = await this.prisma.employee.findUnique({ where: { userId: user.id }, select: { id: true } });
      const permissions = await this.resolvePermissions(user);
      const payload = { sub: user.id, email: user.email, role: user.role, customRoleId: user.customRoleId, org_id: user.organizationId, employeeId: employee?.id || null, permissions };
      const access_token = jwt.sign(payload, (process.env.JWT_SECRET || 'change-me-32-chars-minimum-secret-for-dev') as string, { expiresIn: '15m' } as any);
      return { access_token };
    } catch { throw new UnauthorizedException('Invalid refresh token'); }
  }

  async registerDevice(userId: string, dto: { device_fingerprint: string; device_type: string; device_name?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.prisma.device.create({
      data: {
        organizationId: user.organizationId,
        employeeId: (await this.prisma.employee.findUnique({ where: { userId } }))?.id,
        deviceFingerprint: dto.device_fingerprint,
        deviceType: dto.device_type as any,
        deviceName: dto.device_name,
        isAuthorized: true,
      },
    });
  }
}
