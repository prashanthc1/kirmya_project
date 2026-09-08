import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// The security client used to answer these calls from sample rows compiled
// into it, so this suite proved the samples. It calls the API now, and the API
// is mocked here: each test states what the server returns and asserts what the
// client does with it.
vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

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
import { authApiClient } from '../services/authService';
import {
  MOCK_ACCOUNT_RISK_SCORES,
  MOCK_BOT_SIGNALS,
  MOCK_FRAUD_ALERTS,
  MOCK_SECURITY_ALERTS,
  MOCK_SECURITY_CONFIGS,
  MOCK_SECURITY_RULES,
} from './fixtures/security';
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

const http = authApiClient as unknown as Record<
  'get' | 'post' | 'put' | 'patch' | 'delete',
  ReturnType<typeof vi.fn>
>;

const alertFixture = {
  id: 'alert-1',
  severity: 'high',
  status: 'open',
  is_false_positive: false,
  title: 'Credential stuffing attempt',
};
const ruleFixture = { id: 'rule-1', enabled: false, threshold: 10, name: 'Failed sign-ins' };
const riskFixture = { user_id: 'user-1', risk_score: 62, last_assessed_at: '2026-09-01T00:00:00Z' };
const botSignalFixture = { id: 'bot-1', signal_type: 'headless_browser', confidence: 0.9 };

const resolveWith = (payload: unknown) => ({ data: payload });

describe('Security Operations, Threat Detection & Fraud Prevention Module Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The components below fetch through the same client, so the mock answers
    // by route with the records the assertions name.
    http.get.mockImplementation((url: string) => {
      if (url.includes('/security/alerts')) return Promise.resolve(resolveWith(MOCK_SECURITY_ALERTS));
      if (url.includes('/security/rules')) return Promise.resolve(resolveWith(MOCK_SECURITY_RULES));
      if (url.includes('/security/risk-scores')) return Promise.resolve(resolveWith(MOCK_ACCOUNT_RISK_SCORES));
      if (url.includes('/security/risk-score')) return Promise.resolve(resolveWith(MOCK_ACCOUNT_RISK_SCORES[0]));
      if (url.includes('/security/bot-signals')) return Promise.resolve(resolveWith(MOCK_BOT_SIGNALS));
      if (url.includes('/security/bot-stats')) {
        return Promise.resolve(
          resolveWith({ total_blocked_24h: 42, captcha_challenges_24h: 12, blocked_ips_count: 3 })
        );
      }
      if (url.includes('/security/fraud-alerts')) return Promise.resolve(resolveWith(MOCK_FRAUD_ALERTS));
      if (url.includes('/security/configurations')) return Promise.resolve(resolveWith(MOCK_SECURITY_CONFIGS));
      if (url.includes('/security/sessions')) {
        return Promise.resolve(
          resolveWith([
            {
              id: 's1',
              user_id: 'u1',
              ip_address: '127.0.0.1',
              user_agent: 'Chrome 120.0 / Windows 11',
              location: 'Dubai, UAE',
              is_current: true,
              expires_at: new Date(Date.now() + 604800000).toISOString(),
              created_at: new Date().toISOString(),
              last_active_at: new Date().toISOString(),
              device_type: 'Desktop',
            },
          ])
        );
      }
      if (url.includes('/security/login-history')) {
        return Promise.resolve(
          resolveWith([
            {
              id: 'lh1',
              user_id: 'u1',
              event_type: 'login.success',
              severity: 'low',
              ip_address: '127.0.0.1',
              user_agent: 'Chrome 120.0 / Windows 11',
              location: 'Dubai, UAE',
              status: 'success',
              created_at: new Date().toISOString(),
            },
          ])
        );
      }
      return Promise.resolve(resolveWith([]));
    });
    http.post.mockResolvedValue(resolveWith({}));
    http.put.mockResolvedValue(resolveWith({}));
    http.patch.mockResolvedValue(resolveWith({}));
    http.delete.mockResolvedValue(resolveWith({}));
  });

  // 1. API Services Tests
  describe('Security API Client Methods', () => {
    it('fetches security alerts and updates status', async () => {
      http.get.mockResolvedValueOnce(resolveWith([alertFixture]));
      const alerts = await securityApi.getSecurityAlerts();
      expect(alerts[0].id).toBe('alert-1');

      http.patch.mockResolvedValueOnce(resolveWith({ ...alertFixture, status: 'resolved' }));
      const updated = await securityApi.updateSecurityAlertStatus('alert-1', 'resolved');
      expect(updated.status).toBe('resolved');

      http.patch.mockResolvedValueOnce(
        resolveWith({ ...alertFixture, status: 'false_positive', is_false_positive: true })
      );
      const fp = await securityApi.markAlertFalsePositive('alert-1', 'Verified partner test');
      expect(fp.is_false_positive).toBe(true);
    });

    it('propagates a failed read instead of answering with sample alerts', async () => {
      http.get.mockRejectedValueOnce(new Error('gateway down'));
      await expect(securityApi.getSecurityAlerts()).rejects.toThrow('gateway down');
    });

    it('propagates a failed write instead of reporting the change as applied', async () => {
      http.patch.mockRejectedValueOnce(new Error('conflict'));
      await expect(securityApi.updateSecurityAlertStatus('alert-1', 'resolved')).rejects.toThrow(
        'conflict'
      );
    });

    it('fetches security rules and updates threshold & toggle state', async () => {
      http.get.mockResolvedValueOnce(resolveWith([ruleFixture]));
      const rules = await securityApi.getSecurityRules();
      expect(rules[0].id).toBe('rule-1');

      http.patch.mockResolvedValueOnce(resolveWith({ ...ruleFixture, enabled: true }));
      const toggled = await securityApi.toggleSecurityRule('rule-1', true);
      expect(toggled.enabled).toBe(true);

      http.patch.mockResolvedValueOnce(resolveWith({ ...ruleFixture, threshold: 15 }));
      const updated = await securityApi.updateSecurityRule('rule-1', { threshold: 15 });
      expect(updated.threshold).toBe(15);
    });

    it('fetches risk scores and triggers reassessment', async () => {
      http.get.mockResolvedValueOnce(resolveWith([riskFixture]));
      const scores = await securityApi.getAccountRiskScores();
      expect(scores[0].user_id).toBe('user-1');

      http.get.mockResolvedValueOnce(resolveWith(riskFixture));
      const userScore = await securityApi.getAccountRiskScore('user-1');
      expect(userScore.risk_score).toBe(62);

      http.post.mockResolvedValueOnce(
        resolveWith({ ...riskFixture, last_assessed_at: '2026-09-08T00:00:00Z' })
      );
      const reassessed = await securityApi.reassessAccountRisk('user-1');
      expect(reassessed.last_assessed_at).toBe('2026-09-08T00:00:00Z');
    });

    it('fetches bot signals and mitigation stats', async () => {
      const signals = await securityApi.getBotDetectionSignals();
      expect(signals.length).toBeGreaterThan(0);

      const stats = await securityApi.getBotMitigationStats();
      expect(stats.total_blocked_24h).toBe(42);

      http.post.mockResolvedValueOnce({ status: 200, data: {} });
      const updatedSetting = await securityApi.updateBotMitigationSetting('auto_captcha', true);
      expect(updatedSetting).toBe(true);
    });

    it('fetches fraud alerts and updates mitigation status', async () => {
      const fraudAlerts = await securityApi.getFraudAlerts();
      expect(fraudAlerts.length).toBeGreaterThan(0);

      http.patch.mockResolvedValueOnce(
        resolveWith({
          ...MOCK_FRAUD_ALERTS[0],
          status: 'confirmed_fraud',
          mitigation_action: 'Account suspended',
        })
      );

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
