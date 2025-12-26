'use client';

import { memo } from 'react';

export const SharedBackground = memo(() => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-background" />
  );
});

SharedBackground.displayName = 'SharedBackground';
