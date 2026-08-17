'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherProctorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teacher/assignments');
  }, [router]);

  return null;
}
