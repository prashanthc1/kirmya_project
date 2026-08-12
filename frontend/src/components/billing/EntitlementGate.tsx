'use client';

import React from 'react';

interface EntitlementGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * EntitlementGate checks feature entitlements.
 * When billing is disabled (current product state), all valid children are rendered freely.
 */
export const EntitlementGate: React.FC<EntitlementGateProps> = ({ children }) => {
  return <>{children}</>;
};

export default EntitlementGate;
