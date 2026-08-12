'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface ExamRoomPaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function ExamRoomPaginationBar(props: ExamRoomPaginationBarProps) {
  return <PaginationBar {...props} unit="Phòng thi" />;
}
