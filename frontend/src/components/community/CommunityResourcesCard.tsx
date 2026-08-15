import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Link as MuiLink,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { CommunityResource } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';

interface CommunityResourcesCardProps {
  communityId: string;
  resources: CommunityResource[];
  userRole?: string | null;
  onResourceAdded?: () => void;
}

export const CommunityResourcesCard: React.FC<CommunityResourcesCardProps> = ({
  communityId,
  resources: initialResources,
  userRole,
  onResourceAdded,
}) => {
  const [resources, setResources] = useState<CommunityResource[]>(initialResources);
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'guide' | 'document' | 'link' | 'template' | 'code'>('document');
  const [url, setUrl] = useState('');
  const [fileType, setFileType] = useState('PDF');

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'code':
        return <CodeIcon fontSize="small" />;
      case 'link':
        return <LinkIcon fontSize="small" />;
      default:
        return <DescriptionIcon fontSize="small" />;
    }
  };

  const handleShareSubmit = async () => {
    if (!title || !url) return;
    const created = await communityApi.createResource(communityId, {
      title,
      description,
      category,
      url,
      fileType,
    });
    setResources([created, ...resources]);
    setOpenModal(false);
    setTitle('');
    setDescription('');
    setUrl('');
    if (onResourceAdded) onResourceAdded();
  };

  return (
    <Paper
      data-testid="community-resources-card"
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '20px',
        background: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(99, 102, 241, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderIcon color="primary" /> Shared Knowledge & Resources ({resources.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ borderRadius: '10px', fontWeight: 700 }}
        >
          Add Resource
        </Button>
      </Box>

      {resources.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
          No resources shared yet. Add guides, code templates, or blueprints!
        </Typography>
      ) : (
        <Stack spacing={2}>
          {resources.map((res) => (
            <Card
              key={res.id}
              data-testid={`resource-card-${res.id}`}
              sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                p: 1,
              }}
            >
              <CardContent sx={{ pb: '16px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      icon={getCategoryIcon(res.category)}
                      label={res.category.toUpperCase()}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                    <Typography variant="subtitle1" fontWeight={700}>
                      {res.title}
                    </Typography>
                  </Stack>
                  {res.fileType && (
                    <Chip label={res.fileType} size="small" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {res.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Shared by {res.authorName} • {res.downloadsCount} accesses
                  </Typography>
                  <Button
                    component="a"
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{ borderRadius: '8px', fontWeight: 700 }}
                  >
                    View Resource
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Share Resource Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Share Resource or Guide</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Resource Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Terraform EKS Cluster Blueprint"
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Resource Category"
                fullWidth
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="guide">Guide / Article</option>
                <option value="document">Document / PDF</option>
                <option value="code">Code Repository / Snippet</option>
                <option value="template">Template</option>
                <option value="link">External Link</option>
              </TextField>
              <TextField
                label="Format / File Type"
                fullWidth
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                placeholder="e.g. PDF, ZIP, HCL"
              />
            </Stack>
            <TextField
              label="URL / Link"
              required
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleShareSubmit} variant="contained" disabled={!title || !url}>
            Share Resource
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
