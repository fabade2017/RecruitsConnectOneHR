import { PrismaService } from '../src/prisma/prisma.service';
import { PayrollService } from '../src/modules/payroll/payroll.service';
import { tenantAls, type TenantStore } from '../src/prisma/tenant-context';

const prisma = new PrismaService();
const payroll = new PayrollService(prisma as any);

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, extra = '') {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
}

// Await INSIDE the ALS scope — this mirrors how a controller method awaits.
const asTenant = <T>(store: TenantStore, fn: () => Promise<T>): Promise<T> =>
  tenantAls.run(store, async () => await fn()) as Promise<T>;

async function main() {
  const mk = async (name: string) => {
    const org = await prisma.organization.create({
      data: { name: `${name} Ltd`, acronym: name, status: 'active', isActive: true },
    });
    const user = await prisma.user.create({
      data: { email: `admin@${name.toLowerCase()}.test`, passwordHash: 'x', organizationId: org.id, role: 'hr_admin' },
    });
    const employee = await prisma.employee.create({
      data: { employeeCode: `${name}-0001`, organizationId: org.id, userId: user.id, jobTitle: 'Engineer' } as any,
    });
    const rec = await prisma.payrollMerged.create({
      data: {
        organizationId: org.id, employeeId: employee.id, month: 1, year: 2026,
        basicSalary: 500000, allowances: 0, deductions: 0, tax: 0, netPay: 500000, status: 'DRAFT',
      },
    });
    return { org, user, employee, rec };
  };

  const A = await mk('Acme');
  const B = await mk('Globex');
  const asA: TenantStore = { orgId: A.org.id, role: 'hr_admin' };
  const asB: TenantStore = { orgId: B.org.id, role: 'hr_admin' };

  console.log('\n=== 1. Extension auto-scopes otherwise-unscoped reads ===');
  const rowsA = await asTenant(asA, () => prisma.payrollMerged.findMany({}));
  check('tenant A findMany({}) -> only A', rowsA.length === 1 && rowsA[0].organizationId === A.org.id, `(got ${rowsA.length})`);
  const rowsB = await asTenant(asB, () => prisma.payrollMerged.findMany({}));
  check('tenant B findMany({}) -> only B', rowsB.length === 1 && rowsB[0].organizationId === B.org.id, `(got ${rowsB.length})`);

  console.log('\n=== 2. Concurrent tenants do not bleed into each other ===');
  const [cA1, cA2, cB1] = await Promise.all([
    asTenant(asA, () => prisma.payrollMerged.findMany({})),
    asTenant(asA, () => prisma.payrollMerged.findMany({})),
    asTenant(asB, () => prisma.payrollMerged.findMany({})),
  ]);
  check('3 concurrent queries stay correctly isolated',
    cA1.length === 1 && cA1[0].organizationId === A.org.id &&
    cA2.length === 1 && cA2[0].organizationId === A.org.id &&
    cB1.length === 1 && cB1[0].organizationId === B.org.id,
    `(A=${cA1.length}/${cA2.length}, B=${cB1.length})`);

  console.log('\n=== 3. Cross-tenant findUnique / findFirst / update are blocked ===');
  const crossUnique = await asTenant(asA, () => prisma.payrollMerged.findUnique({ where: { id: B.rec.id } }));
  check('tenant A findUnique(B id) -> null', crossUnique === null);
  const crossUpdate = await asTenant(asA, () =>
    prisma.payrollMerged.update({ where: { id: B.rec.id }, data: { basicSalary: 1 } }).catch((e: any) => e),
  );
  const bIntact = await prisma.payrollMerged.findFirst({ where: { id: B.rec.id } });
  check("B's row cannot be updated from tenant A", Number(bIntact?.basicSalary) === 500000, `(got ${bIntact?.basicSalary})`);
  if (crossUpdate instanceof Error) { /* expected: no rows matched */ }

  console.log('\n=== 4. Create cannot be redirected to another org ===');
  const forced = await asTenant(asA, () =>
    prisma.payrollMerged.create({
      data: {
        organizationId: B.org.id, employeeId: A.employee.id, month: 3, year: 2026,
        basicSalary: 7, allowances: 0, deductions: 0, tax: 0, netPay: 7,
      } as any,
    }),
  );
  check('organizationId forced to caller tenant', forced.organizationId === A.org.id, `(got ${forced.organizationId})`);

  console.log('\n=== 5. Employees scoped too ===');
  const emps = await asTenant(asA, () => prisma.employee.findMany({}));
  check('tenant A sees only its employees', emps.length === 1 && emps[0].id === A.employee.id, `(saw ${emps.length})`);

  console.log('\n=== 6. PayrollService explicit scoping ===');
  let e1: any;
  try { await asTenant(asA, () => payroll.payslip(A.org.id, B.rec.id, { role: 'hr_admin', sub: A.user.id })); }
  catch (e: any) { e1 = e; }
  check('payslip of other org refused', !!e1, e1 ? `(${e1.constructor.name})` : '(NOT REFUSED)');
  const own = await asTenant(asA, () => payroll.payslip(A.org.id, A.rec.id, { role: 'hr_admin', sub: A.user.id }));
  check('own payslip still readable', own?.id === A.rec.id);

  let e2: any;
  try { await asTenant(asA, () => payroll.update(A.org.id, B.rec.id, { basicSalary: 1 })); }
  catch (e: any) { e2 = e; }
  check('update of other org refused', !!e2, e2 ? `(${e2.constructor.name})` : '(NOT REFUSED)');
  const upd = await asTenant(asA, () => payroll.update(A.org.id, A.rec.id, { basicSalary: 600000 }));
  check('update of own org succeeds', Number(upd?.basicSalary) === 600000, `(got ${upd?.basicSalary})`);

  let e3: any;
  try { await asTenant(asA, () => payroll.create(A.org.id, { employeeId: B.employee.id, month: 2, year: 2026, basicSalary: 100 })); }
  catch (e: any) { e3 = e; }
  check('create with foreign employeeId refused', !!e3, e3 ? `(${e3.constructor.name})` : '(NOT REFUSED)');

  console.log('\n=== 7. Bypass / no-context behaviour unchanged ===');
  const superRows = await asTenant({ orgId: null, role: 'super_admin' }, () => prisma.payrollMerged.findMany({}));
  check('super_admin sees all tenants', superRows.length >= 3, `(saw ${superRows.length})`);
  const all = await prisma.payrollMerged.findMany({});
  check('no context (seeds/jobs) -> unscoped', all.length >= 3, `(saw ${all.length})`);
  const orig = await asTenant({ orgId: null, role: 'super_admin' }, () => prisma.payrollMerged.findFirst({ where: { id: B.rec.id } }));
  check('outside a tenant, cross-org read still works (no false positives)', orig?.id === B.rec.id);

  console.log(`\n${'='.repeat(46)}\n  ${pass} passed, ${fail} failed\n${'='.repeat(46)}`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });