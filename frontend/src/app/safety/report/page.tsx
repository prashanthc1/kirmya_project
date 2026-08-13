'use client';

import React, { useState } from 'react';
import ReportDialog from '@/components/safety/ReportDialog';
import SafetyCenter from '@/components/safety/SafetyCenter';

export default function SafetyReportPage() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <SafetyCenter />
      <ReportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
