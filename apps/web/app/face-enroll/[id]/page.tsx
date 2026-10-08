'use client';
import FaceEnrollClient from '../../../components/FaceEnrollClient';

// Path route /face-enroll/<id> — works when the Apache .htaccess rewrite maps any id to the
// pre-rendered placeholder. Static export only emits /face-enroll/placeholder/ (see layout).
export default function FaceEnrollPage() {
  return <FaceEnrollClient />;
}
