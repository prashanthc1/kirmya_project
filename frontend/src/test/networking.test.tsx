import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import NetworkStats from '../components/network/NetworkStats';
import PeopleResultCard from '../components/network/PeopleResultCard';
import ConnectionRequestDialog from '../components/network/ConnectionRequestDialog';
import AdminNetworkView from '../components/admin/network/AdminNetworkView';

describe('People Search & Networking Module Test Suite', () => {
  const dummyPerson: any = {
    id: 'res-1',
    userId: 'u1',
    username: 'ayeshas',
    name: 'Ayesha Siddiqui',
    headline: 'Next.js Frontend Architect',
    location: 'Abu Dhabi, UAE',
    connectionStatus: 'none',
    mutualCount: 2,
    openToWork: true,
  };

  it('renders NetworkStats overview values', () => {
    render(<NetworkStats />);
    expect(screen.getByText(/Your Network Overview & Growth Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Connections/i)).toBeInTheDocument();
  });

  it('renders PeopleResultCard with connect button and mutual count', () => {
    render(<PeopleResultCard person={dummyPerson} />);
    expect(screen.getByText(/Ayesha Siddiqui/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Mutuals/i)).toBeInTheDocument();
  });

  it('renders ConnectionRequestDialog modal', () => {
    render(<ConnectionRequestDialog open={true} targetName="Ayesha Siddiqui" onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByText(/Connect with Ayesha Siddiqui/i)).toBeInTheDocument();
    expect(screen.getByText(/Send Invitation/i)).toBeInTheDocument();
  });

  it('renders AdminNetworkView control desk', () => {
    render(<AdminNetworkView />);
    expect(screen.getByText(/Admin Network Health & Safety Desk/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Connections/i)).toBeInTheDocument();
  });
});
