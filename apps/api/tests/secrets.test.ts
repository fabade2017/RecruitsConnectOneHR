import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret, getJwtRefreshSecret, __resetSecretCaches } from '../src/common/config/secrets';

test('dev: falls back to dev secret when env missing', () => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
  process.env.NODE_ENV = 'development';
  __resetSecretCaches();
  const s = getJwtSecret();
  assert.ok(s.length >= 16);
  assert.equal(getJwtRefreshSecret() !== getJwtSecret(), true);
});

test('production: refuses placeholder secret', () => {
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = 'CHANGE_ME_32_chars_min_jwt_secret_production';
  process.env.JWT_REFRESH_SECRET = 'CHANGE_ME_32_chars_min_refresh_secret_production';
  __resetSecretCaches();
  assert.throws(() => getJwtSecret(), /JWT_SECRET/);
  assert.throws(() => getJwtRefreshSecret(), /JWT_REFRESH_SECRET/);
});

test('production: accepts strong secret and round-trips tokens', () => {
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = 'a'.repeat(48);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(48);
  __resetSecretCaches();
  const secret = getJwtSecret();
  const refreshSecret = getJwtRefreshSecret();
  const access = jwt.sign({ sub: 'u1', role: 'employee' }, secret, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: 'u1', type: 'refresh' }, refreshSecret, { expiresIn: '7d' });
  assert.equal((jwt.verify(access, secret) as any).sub, 'u1');
  assert.equal((jwt.verify(refresh, refreshSecret) as any).type, 'refresh');
  // Access secret must not verify refresh tokens (and vice versa)
  assert.throws(() => jwt.verify(refresh, secret));
});

test('refresh secret used at sign must match verify (regression: mismatch bug)', () => {
  process.env.NODE_ENV = 'development';
  delete process.env.JWT_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
  __resetSecretCaches();
  const refresh = jwt.sign({ sub: 'u1', type: 'refresh' }, getJwtRefreshSecret(), { expiresIn: '7d' });
  const decoded: any = jwt.verify(refresh, getJwtRefreshSecret());
  assert.equal(decoded.type, 'refresh');
});
