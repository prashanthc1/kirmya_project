'use client';

import React, { useId, useState, useSyncExternalStore } from 'react';
import { Box, Button, Menu, MenuItem, ListItemText } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export const WORKSPACES = [
  { id: 'personal', label: 'Personal / Job Seeker', short: 'Personal', href: '/feed' },
  { id: 'recruiter', label: 'Recruiter / Hire Talent', short: 'Recruiter', href: '/recruiter/dashboard' },
  { id: 'freelancer', label: 'Freelancer / Find Work', short: 'Freelancer', href: '/freelance' },
] as const;

const CHANGE_EVENT = 'kirmya-workspace-change';
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
};

// This preference changes navigation only. Authorization continues to come
// from the signed-in account and the server's company/resource permissions.
export default function WorkspaceSwitcher() {
  const { user, authenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const accountId = user?.uuid || user?.id;
  const key = accountId ? `kirmya:workspace:${accountId}` : '';
  const saved = useSyncExternalStore(subscribe, () => {
    try { return key ? localStorage.getItem(key) : null; } catch { return null; }
  }, () => null);
  const routeMode = pathname?.match(/^\/(recruiter|employer)(\/|$)/) || pathname?.match(/^\/companies\/[^/]+\/admin(\/|$)/)
    ? 'recruiter'
    : pathname?.match(/^\/freelance(\/|$)/) ? 'freelancer'
      : pathname?.match(/^\/(feed|profile|jobs|applications|saved-jobs|resume)(\/|$)/) ? 'personal' : null;
  const active = WORKSPACES.find(item => item.id === (routeMode || saved)) || WORKSPACES[0];

  if (!authenticated || !accountId) return null;

  return <>
    <Button
      startIcon={<SwapHorizIcon />}
      aria-label={`Switch profile, current workspace: ${active.label}`}
      aria-haspopup="menu"
      aria-controls={anchor ? menuId : undefined}
      aria-expanded={Boolean(anchor)}
      onClick={event => setAnchor(event.currentTarget)}
      size="small"
      sx={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: { xs: 36, sm: 64 }, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: 0 } }}
    ><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{active.short}</Box></Button>
    <Menu id={menuId} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      {WORKSPACES.map(item => <MenuItem
        key={item.id}
        selected={active.id === item.id}
        onClick={() => {
          try { localStorage.setItem(key, item.id); } catch { /* Navigation still works without storage. */ }
          window.dispatchEvent(new Event(CHANGE_EVENT));
          setAnchor(null);
          router.push(item.href);
        }}
      ><ListItemText primary={item.label} /></MenuItem>)}
    </Menu>
  </>;
}
