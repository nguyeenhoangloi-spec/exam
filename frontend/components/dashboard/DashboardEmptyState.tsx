import React from 'react';
import { EmptyState } from '../ui/EmptyState';

/** Backward-compatible wrapper exposing the shared EmptyState for the dashboard. */
export function DashboardEmptyState({ message }: { message: string }) {
  return <EmptyState message={message} />;
}
