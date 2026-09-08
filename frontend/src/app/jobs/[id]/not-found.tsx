import { Box, Container, Stack, Typography, Button } from '@mui/material';

/**
 * The boundary a closed, expired or unknown posting renders into.
 *
 * It is a route-level, server-rendered boundary rather than falling through to
 * the app-wide one. Two reasons: the copy can say something useful about jobs
 * specifically, and the response carries a real 404 status. A page that answers
 * 200 with "this job is gone" is a soft 404 — it teaches a crawler that every
 * dead posting is still a live page, which is what gets a whole board demoted.
 */
export default function JobNotFound() {
  return (
    <Box
      component="main"
      id="main-content"
      sx={{
        minHeight: '70dvh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={2.5} alignItems="flex-start">
          <Typography variant="h1" sx={{ fontSize: '1.75rem', fontWeight: 700 }}>
            This job is no longer open
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The posting has been filled, withdrawn, or has passed its closing date.
            Similar roles are usually open on the job board.
          </Typography>
          {/*
            A plain href, not component={Link}. This is a server component, and
            passing next/link across the RSC boundary throws "Functions cannot
            be passed directly to Client Components" on every render — the page
            still displayed, so the only evidence was an error in the server log.
          */}
          <Button href="/jobs" variant="contained">
            Browse open jobs
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
