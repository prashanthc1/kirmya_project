'use client';

/**
 * The "About" surface of a company page.
 *
 * Every block is conditional: a company that has not written a mission
 * statement gets no mission section rather than filler prose. If the company
 * has filled in nothing at all, the component says so plainly.
 */
import React from 'react';
import {
  Box,
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';

import { CompanyDetail } from '../../features/company/types';
import { AutoGrid } from './CompanyBadges';

interface CompanyAboutProps {
  company: CompanyDetail;
}

/** One chip block. The colour is fixed per block so the page stays legible. */
type ListSection = { title: string; items: string[]; color?: 'primary' | 'secondary' };

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box component="section" sx={{ mb: 4 }}>
    <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const Prose: React.FC<{ text: string }> = ({ text }) => (
  <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
    {text}
  </Typography>
);

const ChipList: React.FC<{ items: string[]; color?: 'default' | 'primary' | 'secondary' }> = ({
  items,
  color = 'default',
}) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
    {items.map((item) => (
      <Chip key={item} label={item} size="small" color={color} variant="outlined" />
    ))}
  </Stack>
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
      {children}
    </Typography>
  </Box>
);

export const CompanyAbout: React.FC<CompanyAboutProps> = ({ company }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const overviewRows: Array<{ label: string; value: React.ReactNode }> = [];
  if (company.industry) overviewRows.push({ label: 'Industry', value: company.industry });
  if (company.companyType) overviewRows.push({ label: 'Company type', value: company.companyType });
  if (company.companySize) overviewRows.push({ label: 'Company size', value: `${company.companySize} employees` });
  if (company.foundedYear > 0) overviewRows.push({ label: 'Founded', value: company.foundedYear });
  if (company.headquarters) overviewRows.push({ label: 'Headquarters', value: company.headquarters });
  if (company.website) {
    overviewRows.push({
      label: 'Website',
      value: (
        <MuiLink href={company.website} target="_blank" rel="noopener noreferrer nofollow" underline="hover">
          {company.website.replace(/^https?:\/\//, '')}
        </MuiLink>
      ),
    });
  }
  if (company.contactEmail) {
    overviewRows.push({
      label: 'Contact',
      value: (
        <MuiLink href={`mailto:${company.contactEmail}`} underline="hover">
          {company.contactEmail}
        </MuiLink>
      ),
    });
  }
  if (company.contactPhone) overviewRows.push({ label: 'Phone', value: company.contactPhone });
  if (company.operatingCountries.length) {
    overviewRows.push({ label: 'Operating in', value: company.operatingCountries.join(', ') });
  }

  const socialEntries = Object.entries(company.socialLinks || {}).filter(([, url]) => !!url);

  const listSections: ListSection[] = ([
    { title: 'Specialties', items: company.specialties, color: 'primary' },
    { title: 'Values', items: company.values },
    { title: 'Benefits', items: company.benefits, color: 'secondary' },
    { title: 'Products', items: company.products },
    { title: 'Services', items: company.services },
    { title: 'Technology', items: company.technology },
    { title: 'Industries served', items: company.industries },
    { title: 'Awards', items: company.awards },
    { title: 'Certifications', items: company.certifications },
  ] as ListSection[]).filter((section) => section.items?.length);

  const proseSections: Array<{ title: string; text: string }> = [
    { title: 'Overview', text: company.description },
    { title: 'Mission', text: company.mission },
    { title: 'Vision', text: company.vision },
    { title: 'Our story', text: company.history },
    { title: 'Working here', text: company.workCulture },
    { title: 'Careers', text: company.careerInfo },
  ].filter((section) => !!section.text?.trim());

  const isEmpty = !proseSections.length && !listSections.length && !overviewRows.length;

  if (isEmpty) {
    return (
      <Typography variant="body1" color="text.secondary">
        {company.name} has not added company details yet.
      </Typography>
    );
  }

  return (
    <Box>
      {proseSections.map((section) => (
        <Section key={section.title} title={section.title}>
          <Prose text={section.text} />
        </Section>
      ))}

      {overviewRows.length > 0 && (
        <Section title="Company details">
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <AutoGrid min={200} gap={2.5}>
              {overviewRows.map((row) => (
                <DetailRow key={row.label} label={row.label}>
                  {row.value}
                </DetailRow>
              ))}
            </AutoGrid>

            {socialEntries.length > 0 && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {socialEntries.map(([platform, url]) => (
                    <MuiLink
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      underline="hover"
                      variant="body2"
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {platform}
                    </MuiLink>
                  ))}
                </Stack>
              </>
            )}
          </Box>
        </Section>
      )}

      {listSections.map((section) => (
        <Section key={section.title} title={section.title}>
          <ChipList items={section.items} color={section.color} />
        </Section>
      ))}
    </Box>
  );
};

export default CompanyAbout;
