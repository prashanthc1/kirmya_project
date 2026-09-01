import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { SearchCategory, SearchResultItem } from '../../features/search/types';
import { tokens } from '../../theme/tokens';

export interface SearchResultCardProps {
  item: SearchResultItem;
  onAction?: (action: 'view' | 'connect' | 'save' | 'follow' | 'apply', item: SearchResultItem) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ item, onAction }) => {
  const [saved, setSaved] = useState(false);

  const getCategoryTheme = (category: SearchCategory) => {
    switch (category) {
      case 'people':
        return { icon: <PersonIcon fontSize="small" />, color: 'primary', label: 'People' };
      case 'jobs':
        return { icon: <WorkIcon fontSize="small" />, color: 'success', label: 'Jobs' };
      case 'companies':
        return { icon: <BusinessIcon fontSize="small" />, color: 'secondary', label: 'Companies' };
      case 'communities':
        return { icon: <GroupsIcon fontSize="small" />, color: 'warning', label: 'Communities' };
      case 'courses':
        return { icon: <SchoolIcon fontSize="small" />, color: 'info', label: 'Courses' };
      case 'events':
        return { icon: <EventIcon fontSize="small" />, color: 'action', label: 'Events' };
      default:
        return { icon: <SearchIcon fontSize="small" />, color: 'default', label: 'Result' };
    }
  };

  const themeInfo = getCategoryTheme(item.type);
  const tags: string[] = item.metadata?.tags || item.metadata?.skills || item.metadata?.highlights || [];

  const handleSaveToggle = () => {
    setSaved(!saved);
    if (onAction) onAction('save', item);
  };

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${tokens.radius.lg}px`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            src={item.avatar_url}
            sx={{
              width: 52,
              height: 52,
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: 'primary.main',
              fontWeight: 800,
            }}
          >
            {item.title ? item.title[0].toUpperCase() : 'K'}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
                    {item.title}
                  </Typography>
                  <Chip
                    icon={themeInfo.icon}
                    label={themeInfo.label}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  />
                </Stack>

                {item.subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {item.subtitle}
                  </Typography>
                )}
              </Box>

              <Tooltip title={saved ? 'Remove from saved' : 'Save item'}>
                <IconButton size="small" onClick={handleSaveToggle} color={saved ? 'primary' : 'default'}>
                  {saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>

            {item.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.description}
              </Typography>
            )}

            {tags.length > 0 && (
              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1.5, gap: 0.5 }}>
                {tags.slice(0, 5).map((t, idx) => (
                  <Chip
                    key={idx}
                    label={t}
                    size="small"
                    sx={{
                      borderRadius: `${tokens.radius.sm}px`,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                component={Link}
                href={item.url || '#'}
                variant="contained"
                size="small"
                endIcon={<OpenInNewIcon fontSize="small" />}
                sx={{
                  borderRadius: `${tokens.radius.sm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                View Details
              </Button>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SearchResultCard;
