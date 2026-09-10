'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { recruiterApi } from '../../features/recruiter/api';
import { RecruiterCapabilityStatus } from '../../features/recruiter/types';

/*
 * Shows recruiter screens only to accounts that hold the recruiting capability.
 *
 * This is presentation, not protection. Every privileged /recruiter/* route
 * enforces the same rule server-side and answers 403 with
 * RECRUITER_ONBOARDING_REQUIRED or RECRUITER_ACCESS_DISABLED whatever this
 * component renders; removing it would change what the user sees and nothing
 * about what they can do. Before the server-side check existed, the recruiter
 * pages worked for anyone signed in because the API provisioned a recruiter
 * profile on first touch - so without this the pages now render empty, with
 * every request 403ing behind a swallowed catch and no explanation on screen.
 *
 * /recruiter/onboarding is exempt: it is the way out of the pending state, and
 * gating it would send an unonboarded account into a redirect loop.
 */

const ONBOARDING_PATH = '/recruiter/onboarding';

type GateState =
  | { phase: 'loading' }
  | { phase: 'allowed' }
  | { phase: 'redirecting' }
  | { phase: 'suspended' }
  | { phase: 'error' };

export const RecruiterCapabilityGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const exempt = pathname === ONBOARDING_PATH;
  const [state, setState] = useState<GateState>(exempt ? { phase: 'allowed' } : { phase: 'loading' });

  useEffect(() => {
    if (exempt) {
      return;
    }

    let cancelled = false;
    recruiterApi
      .getCapability()
      .then((res) => {
        if (cancelled) return;
        const status: RecruiterCapabilityStatus = res.capabilityStatus;
        if (status === 'active') {
          setState({ phase: 'allowed' });
        } else if (status === 'suspended') {
          setState({ phase: 'suspended' });
        } else {
          setState({ phase: 'redirecting' });
          router.replace(ONBOARDING_PATH);
        }
      })
      .catch(() => {
        // A failed lookup is not a denial. Saying "complete onboarding" to a
        // recruiter whose request timed out would be a lie, and sending them to
        // onboarding would be worse.
        if (!cancelled) setState({ phase: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [exempt, pathname, router]);

  // Checked before the state machine rather than inside it, so the onboarding
  // route renders even if this component is kept mounted across a navigation
  // that flipped `exempt` after the initial state was chosen.
  if (exempt) {
    return <>{children}</>;
  }

  if (state.phase === 'loading' || state.phase === 'redirecting') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Checking recruiting access" />
      </Box>
    );
  }

  if (state.phase === 'suspended') {
    return (
      <Alert severity="error" sx={{ maxWidth: 640 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Recruiting access disabled</Typography>
        <Typography variant="body2">
          Recruiting on this account has been disabled. Completing onboarding again will not restore
          it - contact support if you believe this is a mistake.
        </Typography>
      </Alert>
    );
  }

  if (state.phase === 'error') {
    return (
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        <Alert severity="warning">
          We could not confirm your recruiting access. This is usually temporary.
        </Alert>
        <Box>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Box>
      </Stack>
    );
  }

  return <>{children}</>;
};

export default RecruiterCapabilityGate;
