'use client';

import React from 'react';
import { Box, Button, Stack, Tab, Tabs } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import CompanyTeam from '../../../components/company/CompanyTeam';
import CompanyRecruiters from '../../../components/company/CompanyRecruiters';
import TransferOwnershipDialog from '../../../components/company/TransferOwnershipDialog';

export default function EmployerTeamPage() {
  const [tab, setTab] = React.useState<number>(0);
  const [transferOpen, setTransferOpen] = React.useState<boolean>(false);

  return (
    <CompanyDashboardShell
      title="Recruiter Team & Organization Roles"
      description="Manage organization team members, recruiter permissions, invitations, and administrative ownership."
      requires="team:view"
      actions={({ companyId, can }) =>
        can('company:edit') || can('settings:edit') ? (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<SwapHorizIcon />}
            onClick={() => setTransferOpen(true)}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Transfer Ownership
          </Button>
        ) : null
      }
    >
      {({ membership, companyId }) => (
        <Stack spacing={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, val) => setTab(val)} aria-label="Team management tabs">
              <Tab label="Full Team & Association Requests" />
              <Tab label="Recruiters & Hiring Managers" />
            </Tabs>
          </Box>

          {tab === 0 ? (
            <CompanyTeam membership={membership} />
          ) : (
            <CompanyRecruiters membership={membership} />
          )}

          <TransferOwnershipDialog
            open={transferOpen}
            onClose={() => setTransferOpen(false)}
            companyId={companyId}
          />
        </Stack>
      )}
    </CompanyDashboardShell>
  );
}
