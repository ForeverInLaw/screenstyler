'use client';
import { useEffect, useState } from 'react';
import { DocumentEditSession } from '@/lib/document/edit-session';

/** Finishing on unmount prevents closed controls from leaving history paused. */
export function useDocumentEdit() {
  const [edit] = useState(() => new DocumentEditSession());
  useEffect(() => () => edit.commit(), [edit]);
  return edit;
}
