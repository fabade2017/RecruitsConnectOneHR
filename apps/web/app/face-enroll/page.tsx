'use client';
import FaceEnrollClient from '../../components/FaceEnrollClient';

// Query route /face-enroll/?id=<employee id> — always works on any static host (no Apache
// rewrite needed): this file is exported to out/face-enroll/index.html at build time.
export default function FaceEnrollPage() {
  return <FaceEnrollClient />;
}
