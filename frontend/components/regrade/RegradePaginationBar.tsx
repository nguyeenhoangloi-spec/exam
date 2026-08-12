'use client';

import React from 'react';
import { PaginationBar } from '../ui/PaginationBar';

interface RegradePaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPage: (p: number) => void;
  onLimit: (l: number) => void;
}

export function RegradePaginationBar(props: RegradePaginationBarProps) {
  return <PaginationBar {...props} unit="đơn phúc khảo" />;
}
