import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { activeOrgId, TENANT_SCOPED_MODELS } from './tenant-context';

type AnyArgs = Record<string, any>;

/**
 * Force `organizationId` into a create payload so a caller cannot write into
 * another tenant even if it supplies the field itself.
 */
function scopeCreateData(data: unknown, orgId: string): any {
  if (Array.isArray(data)) {
    return data.map((row) => ({ ...(row as AnyArgs), organizationId: orgId }));
  }
  if (data && typeof data === 'object') {
    return { ...(data as AnyArgs), organizationId: orgId };
  }
  return { organizationId: orgId };
}

/**
 * Narrow a `where` clause to the active tenant. A caller-supplied
 * `organizationId` is overwritten so scoping always wins.
 */
function scopeWhere(where: unknown, orgId: string): AnyArgs {
  if (!where || typeof where !== 'object' || Array.isArray(where)) {
    return { organizationId: orgId };
  }
  return { ...(where as AnyArgs), organizationId: orgId };
}

/**
 * Injects tenant scoping into Prisma operations. This is defence in depth on
 * top of the explicit `where: { organizationId }` filters in each service — it
 * does not replace them, and it does not cover nested relation reads or raw
 * SQL (`$queryRaw` / `$executeRawUnsafe`).
 */
function applyTenantScope(model: string, operation: string, args: AnyArgs): AnyArgs {
  const orgId = activeOrgId();
  if (!orgId) return args;
  if (!TENANT_SCOPED_MODELS.has(model)) return args;

  switch (operation) {
    case 'create':
    case 'createMany':
    case 'createManyAndReturn':
      if (!args.data) return args;
      return { ...args, data: scopeCreateData(args.data, orgId) };

    case 'upsert': {
      const next: AnyArgs = { ...args, where: scopeWhere(args.where, orgId) };
      if (args.create) next.create = scopeCreateData(args.create, orgId);
      return next;
    }

    case 'update':
    case 'updateMany':
    case 'delete':
    case 'deleteMany':
      // `where` is mandatory for these — always narrow, never widen.
      return { ...args, where: scopeWhere(args.where, orgId) };

    case 'findMany':
    case 'findManyOrThrow':
    case 'findFirst':
    case 'findFirstOrThrow':
    case 'findUnique':
    case 'findUniqueOrThrow':
    case 'count':
    case 'aggregate':
    case 'groupBy':
      return args.where === undefined
        ? { ...args, where: { organizationId: orgId } }
        : { ...args, where: scopeWhere(args.where, orgId) };

    default:
      return args;
  }
}

const tenantScopeExtension = {
  name: 'tenant-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        return query(applyTenantScope(model, operation, args || {}));
      },
    },
  },
};

/**
 * Prisma 5 only accepts extensions through `$extends()` (which returns a proxy,
 * not a class), so this composes the client and forwards model access to it.
 * The interface merge below restores full `PrismaClient` typing, so existing
 * call sites like `prisma.employee.findMany()` keep working unchanged.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: any;

  constructor() {
    this.client = new PrismaClient().$extends(tenantScopeExtension);
    return new Proxy(this, {
      get(target: any, prop, receiver) {
        if (Reflect.has(target, prop)) return Reflect.get(target, prop, receiver);
        const value = target.client[prop];
        return typeof value === 'function' ? value.bind(target.client) : value;
      },
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PrismaService extends PrismaClient {}