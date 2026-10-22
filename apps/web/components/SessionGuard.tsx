'use client';
import { useEffect } from 'react';
import { installSessionGuard } from '../lib/session';

/**
 * Mounted once in the root layout. Installs the global 401 -> refresh/logout
 * interceptor and the proactive token-expiry timer.
 */
export default function SessionGuard() {
  useEffect(() => {
    installSessionGuard();
  }, []);
  return null;
}
