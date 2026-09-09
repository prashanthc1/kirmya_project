'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import AppShell from '@/components/shell/AppShell';
import ProtectedRoute from '@/features/auth/components/protectedRoute';
import { companyAdminContext } from '@/shared/navigation/contexts';
import { useCompany } from '@/features/company/hooks';
import { canOpenDashboard } from '@/features/company/permissions';
import AccessDenied from '@/components/shell/AccessDenied';

/**
 * Company management workspace.
 *
 * Scoped to the company in the URL. Management used to live at
 * /company/dashboard, one console for whichever company the session happened to
 * be pointed at, which made "which company am I administering?" a question the
 * address could not answer. Now the address is the answer, and a viewer with a
 * role at one company cannot reach another's by changing anything but the slug
 * - at which point this check, and the API behind it, refuse.
 *
 * Authority comes from the company's own viewer context, not from a global
 * role: `canOpenDashboard` reads the permissions the API issued for THIS
 * company. Absence of a context is not treated as permission.
 */
export default function CompanyAdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const raw = params?.handle;
  const slug = Array.isArray(raw) ? raw[0] : (raw ?? '');
  const { data: company, isLoading } = useCompany(slug);

  const context = companyAdminContext(slug);

  return (
    <ProtectedRoute>
      <AppShell variant="standard" maxWidth="wide" context={context}>
        {isLoading ? (
          <Box
            sx={{ minHeight: '50dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            role="status"
            aria-live="polite"
            aria-label="Checking your access to this company"
          >
            <CircularProgress size={40} />
          </Box>
        ) : canOpenDashboard(company?.viewer) ? (
          children
        ) : (
          <AccessDenied
            label="this company's management"
            detail="Your account holds no administrative role at this company. Ask one of its owners to invite you."
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
