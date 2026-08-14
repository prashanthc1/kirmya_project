'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  Chip,
  Stack,
  Button,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import Link from 'next/link';
import { supportApi } from '@/features/support/services/supportApi';
import { SupportArticle } from '@/features/support/types';

export default function KnowledgeBaseArticlePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const params = useParams();
  const slug = (params.slug as string) || '';

  const [article, setArticle] = useState<SupportArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!slug) return;
    supportApi
      .getArticleBySlug(slug)
      .then((art) => setArticle(art))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFeedback = (isHelpful: boolean) => {
    if (!article || voted !== null) return;
    setVoted(isHelpful);
    supportApi.recordArticleFeedback(article.id, isHelpful).catch(() => {});
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!article) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: '16px' }}>
          Article not found. <Link href="/help">Return to Help Center</Link>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Button
        component={Link}
        href="/help"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3, fontWeight: 800, textTransform: 'none' }}
      >
        Back to Help Center
      </Button>

      <Card
        sx={{
          borderRadius: '24px',
          p: { xs: 3, md: 5 },
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Chip label={article.category_code} color="primary" size="small" sx={{ fontWeight: 800 }} />
          <Typography variant="caption" color="text.secondary">
            Updated {new Date(article.updated_at).toLocaleDateString()}
          </Typography>
        </Stack>

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
          {article.title}
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4, fontStyle: 'italic' }}>
          {article.summary}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'text.primary', mb: 6 }}>
          <Typography paragraph>{article.content}</Typography>
        </Box>

        {article.tags && article.tags.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
            {article.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 4 }} />

        {/* Helpful Feedback */}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Was this article helpful?
          </Typography>
          {voted !== null ? (
            <Alert severity="success" sx={{ display: 'inline-flex', borderRadius: '14px' }}>
              Thank you for your feedback!
            </Alert>
          ) : (
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<ThumbUpOutlinedIcon />}
                onClick={() => handleFeedback(true)}
                sx={{ borderRadius: '12px', fontWeight: 800 }}
              >
                Yes, helpful ({article.helpful_count})
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ThumbDownOutlinedIcon />}
                onClick={() => handleFeedback(false)}
                sx={{ borderRadius: '12px', fontWeight: 800 }}
              >
                No
              </Button>
            </Stack>
          )}
        </Box>

        {/* Support CTA */}
        <Box sx={{ mt: 5, p: 3, borderRadius: '18px', bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)', textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Still need help with this topic?
          </Typography>
          <Button
            component={Link}
            href="/support"
            variant="contained"
            startIcon={<ContactSupportIcon />}
            sx={{ borderRadius: '12px', fontWeight: 800, mt: 1 }}
          >
            Contact Support Desk
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
