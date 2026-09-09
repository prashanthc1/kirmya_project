'use client';

import React from 'react';
import Button from '@mui/material/Button';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Link from 'next/link';
import { canManageEntity, type EntityKind, type EntityViewer } from '../../shared/permissions';
import { routes } from '../../shared/routes';

export interface ManageEntityButtonProps {
  kind: EntityKind;
  slug: string;
  /** The viewer's context for THIS entity. Absent means no authority. */
  viewer: EntityViewer | null | undefined;
  size?: 'small' | 'medium' | 'large';
}

const adminHome: Record<EntityKind, (slug: string) => string> = {
  company: routes.company.admin.home,
  community: routes.community.admin.home,
  page: routes.page.admin.home,
};

/**
 * The contextual "Manage" action.
 *
 * Management is reached from the entity it manages, never from a generic admin
 * link in the global navigation. Rendering nothing for a viewer without
 * authority is a courtesy, not a control: the route behind it re-checks, and so
 * does the API.
 */
export const ManageEntityButton: React.FC<ManageEntityButtonProps> = ({
  kind,
  slug,
  viewer,
  size = 'small',
}) => {
  if (!canManageEntity(kind, viewer)) return null;

  return (
    <Button
      component={Link}
      href={adminHome[kind](slug)}
      variant="outlined"
      size={size}
      startIcon={<SettingsOutlinedIcon />}
      sx={{ textTransform: 'none', fontWeight: 600 }}
    >
      Manage
    </Button>
  );
};

export default ManageEntityButton;
