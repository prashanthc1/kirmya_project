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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SendIcon from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SearchCategory, SearchResultItem } from '../../features/search/types';

export interface SearchResultCardProps {
  item: SearchResultItem;
  onAction?: (action: 'view' | 'connect' | 'save' | 'follow' | 'apply', item: SearchResultItem) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ item, onAction }) => {
  const [saved, setSaved] = useState(false);
  const [connected, setConnected] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [applied, setApplied] = useState(false);

  const getCategoryTheme = (category: SearchCategory) => {
    switch (category) {
      case 'people':
        return { icon: <PersonIcon fontSize="small" />, color: '#38bdf8', label: 'People' };
      case 'jobs':
        return { icon: <WorkIcon fontSize="small" />, color: '#10b981', label: 'Jobs' };
      case 'companies':
        return { icon: <BusinessIcon fontSize="small" />, color: '#a855f7', label: 'Companies' };
      case 'communities':
        return { icon: <GroupsIcon fontSize="small" />, color: '#f59e0b', label: 'Communities' };
      case 'courses':
        return { icon: <SchoolIcon fontSize="small" />, color: '#ec4899', label: 'Courses' };
      case 'events':
        return { icon: <EventIcon fontSize="small" />, color: '#6366f1', label: 'Events' };
      default:
        return { icon: <SearchIcon fontSize="small" />, color: '#38bdf8', label: 'Result' };
    }
  };

  const theme = getCategoryTheme(item.type);
  const tags: string[] = item.metadata?.tags || item.metadata?.skills || item.metadata?.highlights || [];

  const handleSaveToggle = () => {
    setSaved(!saved);
    if (onAction) onAction('save', item);
  };

  const handleConnect = () => {
    setConnected(true);
    if (onAction) onAction('connect', item);
  };

  const handleFollow = () => {
    setFollowed(!followed);
    if (onAction) onAction('follow', item);
  };

  const handleApply = () => {
    setApplied(true);
    if (onAction) onAction('apply', item);
  };

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'rgba(30, 41, 59, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease-in-out',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: theme.color,
          boxShadow: `0 8px 24px 0 rgba(0, 0, 0, 0.4), 0 0 12px 0 ${theme.color}33`,
        },
      }}
    >
      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header row: Badge + Score + Save bookmark */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={React.cloneElement(theme.icon, { style: { color: theme.color } })}
              label={theme.label}
              size="small"
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                border: `1px solid ${theme.color}44`,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
              }}
            />
            {item.score !== undefined && (
              <Chip
                label={`Relevance ${(item.score * 100).toFixed(0)}%`}
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            )}
          </Box>
          <Tooltip title={saved ? 'Saved' : 'Save Item'}>
            <IconButton
              size="small"
              onClick={handleSaveToggle}
              aria-label="save item"
              sx={{ color: saved ? '#f59e0b' : '#64748b', '&:hover': { color: '#f59e0b' } }}
            >
              {saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Title & Avatar */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1.5 }}>
          {item.avatar_url && (
            <Avatar
              src={item.avatar_url}
              alt={item.title}
              sx={{ width: 44, height: 44, border: `2px solid ${theme.color}44` }}
            />
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', lineHeight: 1.3 }}>
              {item.title}
            </Typography>
            {item.subtitle && (
              <Typography variant="body2" sx={{ color: theme.color, fontWeight: 600, mt: 0.25 }}>
                {item.subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, flexGrow: 1, lineHeight: 1.5 }}>
          {item.description}
        </Typography>

        {/* Optional Tags */}
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
            {tags.slice(0, 4).map((tag, idx) => (
              <Chip
                key={idx}
                label={tag}
                size="small"
                sx={{
                  bgcolor: 'rgba(51, 65, 85, 0.5)',
                  color: '#cbd5e1',
                  fontSize: '0.72rem',
                  height: 22,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              />
            ))}
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto' }}>
          <Button
            variant="outlined"
            fullWidth
            href={item.url}
            onClick={() => onAction && onAction('view', item)}
            endIcon={<OpenInNewIcon fontSize="small" />}
            sx={{
              color: theme.color,
              borderColor: `${theme.color}66`,
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 2,
              py: 0.8,
              '&:hover': {
                borderColor: theme.color,
                bgcolor: `${theme.color}15`,
              },
            }}
          >
            View Details
          </Button>

          {item.type === 'people' && (
            <Button
              variant={connected ? 'contained' : 'outlined'}
              onClick={handleConnect}
              disabled={connected}
              startIcon={connected ? <CheckCircleIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
              sx={{
                bgcolor: connected ? '#10b981' : 'transparent',
                color: connected ? '#fff' : '#38bdf8',
                borderColor: '#38bdf8',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                whiteSpace: 'nowrap',
                minWidth: 100,
              }}
            >
              {connected ? 'Connected' : 'Connect'}
            </Button>
          )}

          {item.type === 'jobs' && (
            <Button
              variant={applied ? 'contained' : 'contained'}
              onClick={handleApply}
              disabled={applied}
              startIcon={applied ? <CheckCircleIcon fontSize="small" /> : <SendIcon fontSize="small" />}
              sx={{
                bgcolor: applied ? '#64748b' : '#10b981',
                color: '#ffffff',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                whiteSpace: 'nowrap',
                minWidth: 90,
                '&:hover': { bgcolor: '#059669' },
              }}
            >
              {applied ? 'Applied' : 'Apply'}
            </Button>
          )}

          {item.type === 'companies' && (
            <Button
              variant={followed ? 'contained' : 'outlined'}
              onClick={handleFollow}
              startIcon={followed ? <CheckCircleIcon fontSize="small" /> : <AddCircleOutlineIcon fontSize="small" />}
              sx={{
                bgcolor: followed ? '#a855f7' : 'transparent',
                color: followed ? '#fff' : '#a855f7',
                borderColor: '#a855f7',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                whiteSpace: 'nowrap',
                minWidth: 90,
              }}
            >
              {followed ? 'Following' : 'Follow'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SearchResultCard;
