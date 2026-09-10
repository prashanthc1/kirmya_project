'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import { useAuth } from '../../hooks/useAuth';
import { activeWorkspace } from '../../shared/workspace/active';
import { GROUP_ORDER, groupOf, type Workspace, type WorkspaceType } from '../../shared/workspace/types';

/**
 * Switches between the workspaces this account may enter.
 *
 * It changes what the interface shows, never what the account may do. Each
 * entry is a link to that workspace's own route, and the route enforces its own
 * authorization on arrival - so a workspace rendered here in error opens
 * nothing, and one missing from here is not thereby protected. That is why the
 * control can be built from a served list at all.
 *
 * The current workspace comes from the URL rather than from state this
 * component owns. Reloading, going Back, or opening a deep link therefore all
 * land in the right workspace without anything being persisted or restored.
 */

const ICONS: Record<WorkspaceType, React.ReactNode> = {
  professional: <PersonOutlineIcon fontSize="small" />,
  freelancer: <WorkOutlineIcon fontSize="small" />,
  recruiting: <BadgeOutlinedIcon fontSize="small" />,
  company: <BusinessOutlinedIcon fontSize="small" />,
  community_admin: <GroupsOutlinedIcon fontSize="small" />,
  platform_admin: <ShieldOutlinedIcon fontSize="small" color="error" />,
};

export interface WorkspaceSwitcherProps {
  /** Full width with a left-aligned label, for the mobile drawer. */
  variant?: 'header' | 'drawer';
  /** Called after a workspace is chosen, so the drawer can close itself. */
  onNavigate?: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  variant = 'header',
  onNavigate,
}) => {
  const auth = useAuth();
  // Defensive for the same reason activeWorkspace is: this renders inside the
  // shell on every authenticated page, and no workspaces simply means no
  // switcher.
  const workspaces = auth.workspaces ?? [];
  const workspacesComplete = Boolean(auth.workspacesComplete);
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const active = useMemo(() => activeWorkspace(workspaces, pathname), [workspaces, pathname]);

  const grouped = useMemo(() => {
    return GROUP_ORDER.map(group => ({
      group,
      items: workspaces.filter(workspace => groupOf(workspace.type) === group),
    })).filter(section => section.items.length > 0);
  }, [workspaces]);

  // One workspace is not a choice. Rendering a switcher that cannot switch
  // gives the account a control that does nothing, and every account that has
  // not onboarded anywhere is in exactly that position.
  if (workspaces.length < 2 || !active) {
    return null;
  }

  const close = () => setAnchor(null);
  const choose = () => {
    close();
    onNavigate?.();
  };

  const trigger = (
    <Button
      id="workspace-switcher-button"
      aria-haspopup="menu"
      aria-controls={anchor ? 'workspace-switcher-menu' : undefined}
      aria-expanded={anchor ? true : undefined}
      aria-label={`Current workspace: ${active.label}. Change workspace`}
      onClick={event => setAnchor(event.currentTarget)}
      endIcon={<UnfoldMoreIcon fontSize="small" />}
      startIcon={ICONS[active.type]}
      color="inherit"
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        maxWidth: variant === 'drawer' ? '100%' : 220,
        width: variant === 'drawer' ? '100%' : 'auto',
        justifyContent: variant === 'drawer' ? 'flex-start' : 'center',
        borderRadius: 2,
        px: 1.5,
        '& .MuiButton-endIcon': { marginLeft: 'auto', paddingLeft: 1 },
      }}
    >
      <Box
        component="span"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
      >
        {active.label}
      </Box>
    </Button>
  );

  return (
    <>
      {variant === 'header' ? (
        <Tooltip title="Change workspace">{trigger}</Tooltip>
      ) : (
        trigger
      )}

      <Menu
        id="workspace-switcher-menu"
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        MenuListProps={{ 'aria-labelledby': 'workspace-switcher-button' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { minWidth: 260, maxWidth: 320, mt: 1, p: 0.5 } } }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="overline" color="text.secondary">
            Workspace
          </Typography>
        </Box>

        {grouped.flatMap((section, index) => {
          const items = section.items.map(workspace => (
            <WorkspaceMenuItem
              key={workspace.key}
              workspace={workspace}
              current={workspace.key === active.key}
              onSelect={choose}
            />
          ));
          // A divider between groups, never before the first or after the last.
          return index === 0
            ? items
            : [<Divider key={`divider-${section.group}`} sx={{ my: 0.5 }} />, ...items];
        })}

        {!workspacesComplete && (
          <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Some workspaces could not be loaded. They are not gone — reload to try again.
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

const WorkspaceMenuItem: React.FC<{
  workspace: Workspace;
  current: boolean;
  onSelect: () => void;
}> = ({ workspace, current, onSelect }) => (
  <MenuItem
    component={Link}
    href={workspace.route}
    selected={current}
    onClick={onSelect}
    aria-current={current ? 'true' : undefined}
  >
    <ListItemIcon>{ICONS[workspace.type]}</ListItemIcon>
    <ListItemText
      primary={workspace.label}
      slotProps={{
        primary: {
          sx: {
            fontWeight: current ? 700 : 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        },
      }}
    />
    {current && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
  </MenuItem>
);

export default WorkspaceSwitcher;
