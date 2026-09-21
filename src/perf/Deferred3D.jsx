import { Suspense } from 'react';
import useIdle3D from './useIdle3D';

export default function Deferred3D({ children }) {
  const ready = useIdle3D();
  if (!ready) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}