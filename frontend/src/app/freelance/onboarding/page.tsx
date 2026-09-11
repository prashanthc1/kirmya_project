'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import { useRouter } from 'next/navigation';

import { freelanceApi } from '../../../features/freelance/api';
import { FreelancerCapability } from '../../../features/freelance/types';
import { routes } from '../../../shared/routes';

/**
 * Becoming a freelancer.
 *
 * This page exists because freelancer capability is now something an account
 * acquires deliberately rather than something it acquires by arriving at
 * /freelance. Saving a draft here creates a pending profile; only the second
 * step activates the capability, and only once the profile carries the three
 * things a client needs in order to hire somebody.
 *
 * It is reachable by any signed-in professional account - it is the only door
 * in, so gating it on already being a freelancer would make the capability
 * unobtainable.
 */
export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const [capability, setCapability] = useState<FreelancerCapability>('none');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [skillsText, setSkillsText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await freelanceApi.getOnboardingStatus();
        if (cancelled) return;
        setCapability(status.capability);
        if (status.profile) {
          // Pre-fill from the saved draft, so continuing setup means
          // continuing rather than starting again.
          setHourlyRate(status.profile.hourly_rate ? String(status.profile.hourly_rate) : '');
          setTagline(status.profile.tagline ?? '');
          setSkillsText((status.profile.skills ?? []).join(', '));
        }
      } catch {
        if (!cancelled) setError('Could not load your freelancer setup. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const skills = skillsText
    .split(',')
    .map(skill => skill.trim())
    .filter(Boolean);

  // The same three requirements the server enforces. Mirrored here so the
  // button explains itself before the request rather than after it; the server
  // remains the authority, and a client that skipped this check would still be
  // refused.
  const missing: string[] = [];
  if (!(Number(hourlyRate) > 0)) missing.push('an hourly rate');
  if (!tagline.trim()) missing.push('a tagline');
  if (skills.length === 0) missing.push('at least one skill');

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await freelanceApi.saveProfile({
        hourly_rate: Number(hourlyRate),
        tagline: tagline.trim(),
        skills,
        portfolio_links: [],
      });
      await freelanceApi.completeOnboarding();
      router.push(routes.freelance.home());
    } catch {
      setError('Could not complete your freelancer setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (capability === 'active') {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="success" action={<Button href={routes.freelance.home()}>Go to Freelance</Button>}>
          Your freelancer profile is active. You can send proposals.
        </Alert>
      </Container>
    );
  }

  if (capability === 'suspended') {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        {/* Onboarding is not a way back in from a suspension: the server
            refuses it, and offering the form here would be an affordance that
            exists only to fail. */}
        <Alert severity="warning">
          Freelancing is suspended for this account. Your Kirmya account, profile and history are
          unaffected. Contact support to discuss reinstatement.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <WorkIcon color="primary" />
        <Typography variant="h5" component="h1" fontWeight="bold">
          {capability === 'pending' ? 'Finish your freelancer setup' : 'Become a freelancer'}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Freelancing is separate from the rest of your Kirmya account. Setting it up adds a Freelance
        workspace; it changes nothing else about your profile.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Hourly rate"
            type="number"
            value={hourlyRate}
            onChange={event => setHourlyRate(event.target.value)}
            inputProps={{ min: 1, 'aria-label': 'Hourly rate' }}
            helperText="What you charge per hour. Clients see this."
            fullWidth
          />
          <TextField
            label="Tagline"
            value={tagline}
            onChange={event => setTagline(event.target.value)}
            inputProps={{ maxLength: 120, 'aria-label': 'Tagline' }}
            helperText="One line describing the work you do."
            fullWidth
          />
          <Box>
            <TextField
              label="Skills"
              value={skillsText}
              onChange={event => setSkillsText(event.target.value)}
              inputProps={{ 'aria-label': 'Skills' }}
              helperText="Comma separated, for example: Go, PostgreSQL, React"
              fullWidth
            />
            {skills.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                {skills.map(skill => (
                  <Chip key={skill} label={skill} size="small" />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Button
              variant="contained"
              size="large"
              onClick={submit}
              disabled={saving || missing.length > 0}
              fullWidth
            >
              {saving ? 'Setting up…' : 'Start freelancing'}
            </Button>
            {missing.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Still needed: {missing.join(', ')}.
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
