import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, getSystemPermissions, isPlatformSuperAdmin, getPlatformOrgAcronym } from '../src/common/guards/rbac.guard';

test('exact permission match', () => {
  assert.equal(hasPermission(['employee:read'], 'employee:read'), true);
  assert.equal(hasPermission(['employee:read'], 'employee:update'), false);
});

test('wildcard module grants all actions in module', () => {
  assert.equal(hasPermission(['employee:*'], 'employee:update'), true);
  assert.equal(hasPermission(['employee:*'], 'attendance:read'), false);
});

test('star grants everything', () => {
  assert.equal(hasPermission(['*'], 'anything:at:all'), true);
});

test('no cross-module base over-grant (leave:request:self must NOT grant leave:approve:team)', () => {
  assert.equal(hasPermission(['leave:request:self'], 'leave:approve:team'), false);
  assert.equal(hasPermission(['leave:read:self'], 'leave:approve:team'), false);
  assert.equal(hasPermission(['leave:request:self'], 'leave:read'), false);
});

test('required wildcard: shift:* endpoint accepts granular shift:read user perm', () => {
  assert.equal(hasPermission(['shift:read'], 'shift:*'), true);
  assert.equal(hasPermission(['shift:read'], 'attendance:*'), false);
  assert.equal(hasPermission(['leave:request:self'], 'leave:*'), true);
});

test('manager cannot use hr_admin-only perms via base collision', () => {
  const manager = getSystemPermissions('manager');
  assert.equal(hasPermission(manager, 'payroll:update'), false);
  assert.equal(hasPermission(manager, 'payroll:read'), true);
  assert.equal(hasPermission(manager, 'employee:create'), false);
  assert.equal(hasPermission(manager, 'leave:approve:team'), true);
});

test('employee cannot approve leave or manage payroll', () => {
  const employee = getSystemPermissions('employee');
  assert.equal(hasPermission(employee, 'leave:approve:team'), false);
  assert.equal(hasPermission(employee, 'payroll:update'), false);
  assert.equal(hasPermission(employee, 'attendance:clock'), true);
});

test('empty / invalid perms deny', () => {
  assert.equal(hasPermission([], 'employee:read'), false);
  assert.equal(hasPermission(null as any, 'employee:read'), false);
});

test('platform super admin checks use env acronym', () => {
  process.env.SUPER_ADMIN_ORG_ACRONYM = 'RC';
  assert.equal(getPlatformOrgAcronym(), 'RC');
  assert.equal(isPlatformSuperAdmin({ role: 'super_admin', org_acronym: 'RC' }), true);
  assert.equal(isPlatformSuperAdmin({ role: 'super_admin', org_acronym: 'OTHER' }), false);
  assert.equal(isPlatformSuperAdmin({ role: 'org_admin', org_acronym: 'RC' }), false);
});
