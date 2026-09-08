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
    if (!email || !password) throw new UnauthorizedException('Email and password required');
    if (!orgAcronym || !orgAcronym.trim()) throw new UnauthorizedException('Organization acronym required');
    const ac = orgAcronym.trim().toUpperCase();
    // Acronym must exist
    const orgByAcronym = await this.prisma.organization.findUnique({ where: { acronym: ac } });
    if (!orgByAcronym) throw new UnauthorizedException('Invalid organization acronym');
    // Find user by email AND organization (acronym scopes the tenant) — prevents cross-org email collision confusion
    const user = await this.prisma.user.findFirst({ where: { email, organizationId: orgByAcronym.id } });
    if (!user) throw new UnauthorizedException('Invalid credentials for this organization');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const org = orgByAcronym;
    // Gate: org must be approved/active unless super_admin
    if (user.role !== 'super_admin') {
      if ((org as any).status === 'pending' || (org as any).isActive === false) {
        // Check if super_admin has granted via active subscription
        const sub = await this.prisma.organizationSubscription.findFirst({ where: { organizationId: org.id, status: 'active' } });
        if (!sub) throw new UnauthorizedException('Organization pending approval by Super Admin. You will be notified once activated.');
        // auto-activate if subscription exists but status still pending (self-heal)
        if ((org as any).status !== 'active') {
          await this.prisma.organization.update({ where: { id: org.id }, data: { status: 'active', isActive: true } as any }).catch(()=>{});
        }
      }
    }
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
