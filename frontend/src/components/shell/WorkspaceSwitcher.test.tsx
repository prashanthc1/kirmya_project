import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import WorkspaceSwitcher from './WorkspaceSwitcher';

const state = vi.hoisted(() => ({ pathname: '/settings', user: { id: 'account-a', uuid: 'account-a' }, authenticated: true, push: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname, useRouter: () => ({ push: state.push }) }));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => state }));

describe('workspace switching', () => {
  beforeEach(() => {
    cleanup(); localStorage.clear(); vi.restoreAllMocks(); state.push.mockClear();
    state.pathname = '/settings'; state.user = { id: 'account-a', uuid: 'account-a' }; state.authenticated = true;
  });
  it('offers every workspace and persists the chosen destination without changing identity', () => {
    render(<WorkspaceSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /Switch profile/ }));
    expect(screen.getByRole('menuitem', { name: 'Personal / Job Seeker' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Freelancer / Find Work' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Recruiter / Hire Talent' }));
    expect(state.push).toHaveBeenCalledWith('/recruiter/dashboard');
    expect(localStorage.getItem('kirmya:workspace:account-a')).toBe('recruiter');
    expect(state.user.id).toBe('account-a');
    cleanup(); render(<WorkspaceSwitcher />);
    expect(screen.getByRole('button', { name: /current workspace: Recruiter/ })).toBeInTheDocument();
  });
  it('does not inherit another account preference', () => {
    localStorage.setItem('kirmya:workspace:account-a', 'freelancer');
    const view = render(<WorkspaceSwitcher />);
    expect(screen.getByRole('button', { name: /current workspace: Freelancer/ })).toBeInTheDocument();
    state.user = { id: 'account-b', uuid: 'account-b' }; view.rerender(<WorkspaceSwitcher />);
    expect(screen.getByRole('button', { name: /current workspace: Personal/ })).toBeInTheDocument();
  });
  it('uses the current portal over a stale saved selection', () => {
    localStorage.setItem('kirmya:workspace:account-a', 'personal'); state.pathname = '/freelance';
    render(<WorkspaceSwitcher />);
    expect(screen.getByRole('button', { name: /current workspace: Freelancer/ })).toBeInTheDocument();
  });
  it('still navigates when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<WorkspaceSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /Switch profile/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Freelancer / Find Work' }));
    expect(state.push).toHaveBeenCalledWith('/freelance');
  });
  it('does not show account switching while signed out', () => {
    state.authenticated = false; render(<WorkspaceSwitcher />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
