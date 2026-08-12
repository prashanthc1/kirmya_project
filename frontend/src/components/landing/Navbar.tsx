'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SecurityIcon from '@mui/icons-material/Security';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { label: 'Home', href: '#' },
  // A real route, not an anchor: there is no id="jobs" section on the landing
  // page, so this scrolled nowhere. handleNavClick routes non-hash hrefs.
  { label: 'Jobs', href: '/jobs' },
  { label: 'Companies', href: '#companies' },
  { label: 'Communities', href: '#communities' },
  { label: 'About', href: '#why-kirmya' },
  { label: 'Contact', href: '#footer' },
];

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Home');
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLang, setSelectedLang] = useState('English (US)');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (label: string, href: string) => {
    setActiveSection(label);
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(href);
    }
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        width: '100%',
        backdropFilter: 'blur(16px)',
        bgcolor: scrolled
          ? isDark
            ? 'rgba(9, 13, 22, 0.85)'
            : 'rgba(255, 255, 255, 0.9)'
          : 'transparent',
        borderBottom: scrolled
          ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)'}`
          : '1px solid transparent',
        transition: 'all 0.3s ease',
        py: 1.5,
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.2}
            onClick={() => handleNavClick('Home', '#')}
            sx={{ cursor: 'pointer' }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
              }}
            >
              <SecurityIcon sx={{ color: '#ffffff', fontSize: 22 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.02em',
                background: isDark
                  ? 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)'
                  : 'linear-gradient(90deg, #0f172a 0%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              KIRMYA
            </Typography>
          </Stack>

          {/* Desktop Nav Links */}
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((link) => {
              const isActive = activeSection === link.label;
              return (
                <Button
                  key={link.label}
                  onClick={() => handleNavClick(link.label, link.href)}
                  sx={{
                    color: isActive
                      ? isDark
                        ? '#818cf8'
                        : '#4f46e5'
                      : isDark
                      ? '#94a3b8'
                      : '#475569',
                    fontWeight: isActive ? 700 : 500,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    px: 2,
                    py: 0.8,
                    borderRadius: '10px',
                    position: 'relative',
                    '&:hover': {
                      color: isDark ? '#ffffff' : '#0f172a',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(99, 102, 241, 0.06)',
                    },
                  }}
                >
                  {link.label}
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 16,
                        height: 2,
                        borderRadius: 1,
                        bgcolor: 'primary.main',
                      }}
                    />
                  )}
                </Button>
              );
            })}
          </Stack>

          {/* Right Action Items */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {/* Language Selector */}
            <Button
              size="small"
              onClick={(e) => setLangAnchorEl(e.currentTarget)}
              startIcon={<LanguageIcon fontSize="small" />}
              endIcon={<ArrowDropDownIcon fontSize="small" />}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                color: 'text.secondary',
                textTransform: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              {selectedLang.split(' ')[0]}
            </Button>
            <Menu
              anchorEl={langAnchorEl}
              open={Boolean(langAnchorEl)}
              onClose={() => setLangAnchorEl(null)}
            >
              {['English (US)', 'Arabic (العربية)', 'French (Français)', 'German (Deutsch)'].map((lang) => (
                <MenuItem
                  key={lang}
                  selected={selectedLang === lang}
                  onClick={() => {
                    setSelectedLang(lang);
                    setLangAnchorEl(null);
                  }}
                >
                  {lang}
                </MenuItem>
              ))}
            </Menu>

            {/* Dark/Light Mode Toggle */}
            <ThemeToggle />

            {/* Auth Buttons */}
            <Button
              variant="text"
              onClick={() => router.push('/signin')}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                fontWeight: 700,
                color: isDark ? '#f8fafc' : '#1e293b',
                textTransform: 'none',
              }}
            >
              Sign In
            </Button>

            <Button
              variant="contained"
              onClick={() => router.push('/signup')}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                py: 1,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                },
              }}
            >
              Sign Up
            </Button>

            {/* Mobile Menu Toggle Button */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, color: 'text.primary' }}
              aria-label="Open mobile menu"
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: isDark ? '#090d16' : '#ffffff',
            p: 3,
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Navigation
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <List>
          {navLinks.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton onClick={() => handleNavClick(link.label, link.href)}>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    fontWeight: activeSection === link.label ? 700 : 500,
                    color: activeSection === link.label ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Stack spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setMobileOpen(false);
              router.push('/signin');
            }}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setMobileOpen(false);
              router.push('/signup');
            }}
          >
            Sign Up
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
};

export default Navbar;
