import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  async setTenant(orgId: string) {
    // PostgreSQL RLS vs MSSQL session context — handle both
    try {
      // MSSQL
      await this.$executeRawUnsafe(`EXEC sp_set_session_context @key=N'org_id', @value=N'${orgId}'`);
    } catch {
      try {
        // PostgreSQL fallback
        await this.$executeRawUnsafe(`SET LOCAL app.org_id = '${orgId}'`);
      } catch {}
    }
  }
}
