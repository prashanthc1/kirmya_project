'use client';

import React from 'react';
import { Box, Typography, Grid, Stack, useTheme } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import BusinessIcon from '@mui/icons-material/Business';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HotelIcon from '@mui/icons-material/Hotel';
import SchoolIcon from '@mui/icons-material/School';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import SecurityIcon from '@mui/icons-material/Security';
import CellTowerIcon from '@mui/icons-material/CellTower';
import MovieIcon from '@mui/icons-material/Movie';

import GlassCard from '../landing/GlassCard';
import { IndustryCategory } from '../../features/companies/types';

interface IndustryGridProps {
  industries?: IndustryCategory[];
  onSelectIndustry: (name: string) => void;
}

const defaultIndustries: IndustryCategory[] = [
  { id: '1', name: 'Technology', icon: 'Code', companyCount: 1420, openJobs: 8400 },
  { id: '2', name: 'Facilities Management', icon: 'Business', companyCount: 850, openJobs: 4200 },
  { id: '3', name: 'Healthcare', icon: 'LocalHospital', companyCount: 980, openJobs: 5600 },
  { id: '4', name: 'Construction & Real Estate', icon: 'Apartment', companyCount: 1120, openJobs: 6100 },
  { id: '5', name: 'Finance & Banking', icon: 'AccountBalance', companyCount: 1250, openJobs: 7300 },
  { id: '6', name: 'Logistics & Supply Chain', icon: 'LocalShipping', companyCount: 640, openJobs: 3100 },
  { id: '7', name: 'Engineering', icon: 'Engineering', companyCount: 890, openJobs: 4500 },
  { id: '8', name: 'Oil & Gas', icon: 'PropaneTank', companyCount: 510, openJobs: 2800 },
  { id: '9', name: 'Retail & E-commerce', icon: 'ShoppingCart', companyCount: 760, openJobs: 3900 },
  { id: '10', name: 'Hospitality & Tourism', icon: 'Hotel', companyCount: 680, openJobs: 3400 },
  { id: '11', name: 'Education', icon: 'School', companyCount: 540, openJobs: 2100 },
  { id: '12', name: 'Manufacturing', icon: 'PrecisionManufacturing', companyCount: 620, openJobs: 2900 },
  { id: '13', name: 'Government & Defense', icon: 'Security', companyCount: 310, openJobs: 1500 },
  { id: '14', name: 'Telecommunications', icon: 'CellTower', companyCount: 420, openJobs: 2300 },
  { id: '15', name: 'Media & Entertainment', icon: 'Movie', companyCount: 390, openJobs: 1800 },
];

const iconMap: { [key: string]: React.ReactNode } = {
  Code: <CodeIcon sx={{ color: '#6366f1' }} />,
  Business: <BusinessIcon sx={{ color: '#ec4899' }} />,
  LocalHospital: <LocalHospitalIcon sx={{ color: '#10b981' }} />,
  Apartment: <ApartmentIcon sx={{ color: '#f59e0b' }} />,
  AccountBalance: <AccountBalanceIcon sx={{ color: '#06b6d4' }} />,
  LocalShipping: <LocalShippingIcon sx={{ color: '#8b5cf6' }} />,
  Engineering: <EngineeringIcon sx={{ color: '#3b82f6' }} />,
  PropaneTank: <PropaneTankIcon sx={{ color: '#eab308' }} />,
  ShoppingCart: <ShoppingCartIcon sx={{ color: '#ec4899' }} />,
  Hotel: <HotelIcon sx={{ color: '#10b981' }} />,
  School: <SchoolIcon sx={{ color: '#6366f1' }} />,
  PrecisionManufacturing: <PrecisionManufacturingIcon sx={{ color: '#f59e0b' }} />,
  Security: <SecurityIcon sx={{ color: '#06b6d4' }} />,
  CellTower: <CellTowerIcon sx={{ color: '#8b5cf6' }} />,
  Movie: <MovieIcon sx={{ color: '#ec4899' }} />,
};

export const IndustryGrid: React.FC<IndustryGridProps> = ({ industries, onSelectIndustry }) => {
  const list = industries && industries.length > 0 ? industries : defaultIndustries;

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'text.primary' }}>
        Explore Employers by Industry
      </Typography>

      <Grid container spacing={2}>
        {list.map((ind) => (
          <Grid item xs={6} sm={4} md={2.4} key={ind.id}>
            <GlassCard
              onClick={() => onSelectIndustry(ind.name)}
              sx={{ cursor: 'pointer', p: 2.5, textAlign: 'center', height: '100%' }}
            >
              <Stack spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {iconMap[ind.icon] || <BusinessIcon sx={{ color: '#6366f1' }} />}
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
                  {ind.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {ind.companyCount} Companies • {ind.openJobs} Jobs
                </Typography>
              </Stack>
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default IndustryGrid;
