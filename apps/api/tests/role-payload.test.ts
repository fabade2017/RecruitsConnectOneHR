import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRoleUpdate } from '../src/modules/admin/role-payload';

test('drops the permissionLinks relation array that made Prisma throw a 500', () => {
  const { data } = buildRoleUpdate({
    name: 'Employee',
    slug: 'employee',
    permissions: ['document:read'],
    permissionLinks: [],
  });
  assert.equal('permissionLinks' in data, false);
});

test('drops immutable columns the client echoes back', () => {
  const { data } = buildRoleUpdate({
    id: '958504a3-6a01-4e98-96a1-963524adcdae',
    organizationId: '2112f314-09cb-4c84-8d34-c2274e2011eb',
    createdBy: '606a38d6-b80e-4b78-8500-348aa7666fbe',
    createdAt: '2026-09-08T16:19:10.961Z',
    updatedAt: '2026-10-19T16:43:12.390Z',
    isSystem: false,
    name: 'Employee',
  });
  assert.deepEqual(Object.keys(data), ['name']);
});

test('keeps editable columns only', () => {
  const { data } = buildRoleUpdate({
    name: 'Employee',
    slug: 'Employee',
    description: 'Employee',
    isActive: false,
    somethingElse: 'nope',
  });
  assert.equal(data.name, 'Employee');
  assert.equal(data.slug, 'employee');
  assert.equal(data.description, 'Employee');
  assert.equal(data.isActive, false);
  assert.equal('somethingElse' in data, false);
});

test('permissions array is stored as a JSON string', () => {
  const { data } = buildRoleUpdate({ permissions: ['document:read', 'document:*'] });
  assert.equal(data.permissions, '["document:read","document:*"]');
});

test('permissions already serialised are kept as-is', () => {
  const { data } = buildRoleUpdate({ permissions: '["leave:read"]' });
  assert.equal(data.permissions, '["leave:read"]');
});

test('permission ids are extracted from objects and strings', () => {
  const { permissionIds } = buildRoleUpdate({ permissionLinks: [{ id: 'p1' }, 'p2', { id: 'p1' }, null, 7] });
  assert.deepEqual(permissionIds, ['p1', 'p2']);
});

test('permission ids stay null when the client did not touch the relation', () => {
  const { permissionIds } = buildRoleUpdate({ name: 'Employee' });
  assert.equal(permissionIds, null);
});
