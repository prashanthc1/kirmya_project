import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    id: 'inc-1',
  }),
}));

import { securityApi } from '../features/security/services/securityApi';
import SecurityCenter from '../components/security/SecurityCenter';
import SessionManagerView from '../components/security/SessionManagerView';
import DeviceManagerView from '../components/security/DeviceManagerView';
import LoginHistoryView from '../components/security/LoginHistoryView';
import MFASetupDialog from '../components/security/MFASetupDialog';
import APIKeyManagerDialog from '../components/security/APIKeyManagerDialog';
import AdminSecurityDashboard from '../components/security/AdminSecurityDashboard';
import SecurityAlertsDesk from '../components/security/SecurityAlertsDesk';
import SecurityRulesConfig from '../components/security/SecurityRulesConfig';
import AccountRiskScorecard from '../components/security/AccountRiskScorecard';
import BotMitigationDashboard from '../components/security/BotMitigationDashboard';
import FraudThreatMonitor from '../components/security/FraudThreatMonitor';

import AdminSecurityPage from '../app/admin/security/page';
import SecurityAlertsPage from '../app/admin/security/alerts/page';
import SecurityConfigurationPage from '../app/admin/security/configuration/page';
import SettingsSecurityPage from '../app/settings/security/page';

describe('Security Operations, Threat Detection & Fraud Prevention Module Test Suite', () => {
  // 1. API Services Tests
  describe('Security API Client Methods', () => {
    it('fetches security alerts and updates status', async () => {
      const alerts = await securityApi.getSecurityAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('id');
      expect(alerts[0]).toHaveProperty('severity');

      const updated = await securityApi.updateSecurityAlertStatus(alerts[0].id, 'resolved');
      expect(updated.status).toBe('resolved');

      const fp = await securityApi.markAlertFalsePositive(alerts[0].id, 'Verified partner test');
      expect(fp.status).toBe('false_positive');
      expect(fp.is_false_positive).toBe(true);
    });

    it('fetches security rules and updates threshold & toggle state', async () => {
      const rules = await securityApi.getSecurityRules();
      expect(rules.length).toBeGreaterThan(0);

      const toggled = await securityApi.toggleSecurityRule(rules[0].id, !rules[0].enabled);
      expect(toggled.enabled).toBe(!rules[0].enabled);

      const updated = await securityApi.updateSecurityRule(rules[0].id, { threshold: 15 });
      expect(updated.threshold).toBe(15);
    });

    it('fetches risk scores and triggers reassessment', async () => {
      const scores = await securityApi.getAccountRiskScores();
      expect(scores.length).toBeGreaterThan(0);

      const userScore = await securityApi.getAccountRiskScore(scores[0].user_id);
      expect(userScore).toBeDefined();

      const reassessed = await securityApi.reassessAccountRisk(scores[0].user_id);
      expect(reassessed.last_assessed_at).toBeDefined();
    });

    it('fetches bot signals and mitigation stats', async () => {
      const signals = await securityApi.getBotDetectionSignals();
      expect(signals.length).toBeGreaterThan(0);

      const stats = await securityApi.getBotMitigationStats();
      expect(stats.total_blocked_24h).toBeGreaterThan(0);

      const updatedSetting = await securityApi.updateBotMitigationSetting('auto_captcha', true);
      expect(updatedSetting).toBe(true);
    });

    it('fetches fraud alerts and updates mitigation status', async () => {
      const fraudAlerts = await securityApi.getFraudAlerts();
      expect(fraudAlerts.length).toBeGreaterThan(0);

      const updatedFraud = await securityApi.updateFraudAlertStatus(
        fraudAlerts[0].id,
        'confirmed_fraud',
        'Account suspended'
      );
      expect(updatedFraud.status).toBe('confirmed_fraud');
      expect(updatedFraud.mitigation_action).toBe('Account suspended');
    });
  });

  // 2. Component Unit Tests
  describe('Security Desk & Threat Monitor Components', () => {
    it('renders SecurityAlertsDesk with threat table and filter options', async () => {
      render(<SecurityAlertsDesk />);
      expect(screen.getByText(/Security Operations Center - Threat & Incident Desk/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Multiple Failed Authentication Attempts/i)).toBeInTheDocument();
      });
    });

    it('renders SecurityRulesConfig with configurable rule thresholds', async () => {
      render(<SecurityRulesConfig />);
      expect(screen.getByText(/Security Rules & Safeguard Controllers/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Brute Force Auth Prevention/i)).toBeInTheDocument();
      });
    });

    it('renders AccountRiskScorecard widget with risk factors', async () => {
      render(<AccountRiskScorecard />);
      expect(screen.getByText(/Account Risk Scorecard & Factor Analysis/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getAllByText(/OVERALL ACCOUNT RISK SCORE/i).length).toBeGreaterThan(0);
      });
    });

    it('renders BotMitigationDashboard with burst metrics and policy switches', async () => {
      render(<BotMitigationDashboard />);
      expect(screen.getByText(/Bot Detection & Burst Mitigation Engine/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/BLOCKED BOTS \(24H\)/i)).toBeInTheDocument();
      });
    });

    it('renders FraudThreatMonitor with fraud vector cards', async () => {
      render(<FraudThreatMonitor />);
      expect(screen.getByText(/Fraud & Abuse Prevention Monitor/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/High Compensation Remote Wire Scam Listing/i)).toBeInTheDocument();
      });
    });

    it('renders SecurityCenter settings dashboard with security score gauge', async () => {
      render(<SecurityCenter />);
      expect(screen.getAllByText(/Security/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Security Score Gauge/i)).toBeInTheDocument();
    });

    it('renders SessionManagerView active sessions list', async () => {
      render(<SessionManagerView />);
      expect(screen.getByText(/Active Authentication Sessions/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Chrome 120.0 \/ Windows 11/i)).toBeInTheDocument();
      });
    });

    it('renders DeviceManagerView trusted devices', async () => {
      render(<DeviceManagerView />);
      await waitFor(() => {
        expect(screen.getAllByText(/Trusted/i).length).toBeGreaterThan(0);
      });
    });

    it('renders LoginHistoryView audit event timeline', async () => {
      render(<LoginHistoryView />);
      expect(screen.getByText(/Login Security & Audit Event Timeline/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/login.success/i)).toBeInTheDocument();
      });
    });

    it('renders MFASetupDialog workflow', () => {
      render(<MFASetupDialog open={true} onClose={() => {}} />);
      expect(screen.getByText(/Two-Factor Authentication Setup/i)).toBeInTheDocument();
      expect(screen.getByText(/Scan Authenticator QR Code/i)).toBeInTheDocument();
    });

    it('renders APIKeyManagerDialog key generator', () => {
      render(<APIKeyManagerDialog open={true} onClose={() => {}} />);
      expect(screen.getByText(/Create New Scoped API Key/i)).toBeInTheDocument();
      expect(screen.getByText(/profile.read/i)).toBeInTheDocument();
    });

    it('renders AdminSecurityDashboard executive security console', async () => {
      render(<AdminSecurityDashboard />);
      expect(screen.getByText(/Executive Security & Threat Monitor Console/i)).toBeInTheDocument();
      expect(screen.getByText(/Threat Level Normal/i)).toBeInTheDocument();
    });
  });

  // 3. Next.js App Router Security Pages Tests
  describe('Security App Router Pages', () => {
    it('renders AdminSecurityPage Executive SOC view', async () => {
      render(<AdminSecurityPage />);
      expect(screen.getByText(/Executive Security Operations Center \(SOC\)/i)).toBeInTheDocument();
    });

    it('renders SecurityAlertsPage dedicated alerts monitor', async () => {
      render(<SecurityAlertsPage />);
      expect(screen.getAllByText(/Security Alerts & Threat Monitor/i).length).toBeGreaterThan(0);
    });

    it('renders SecurityConfigurationPage studio view', async () => {
      render(<SecurityConfigurationPage />);
      expect(screen.getAllByText(/Security Rules & System Safeguards Studio/i).length).toBeGreaterThan(0);
    });

    it('renders SettingsSecurityPage user account security center', async () => {
      render(<SettingsSecurityPage />);
      expect(screen.getAllByText(/Security & Identity Protection Center/i).length).toBeGreaterThan(0);
    });
  });
});
