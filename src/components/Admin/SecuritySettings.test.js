import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SecuritySettings from './SecuritySettings';
import { AdminApi } from '../../services/api';

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'uz' }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'superadmin', name: 'Test' } }),
}));

jest.mock('../../services/api', () => ({
  changePassword: jest.fn(),
  AdminApi: {
    securityEvents: {
      list: jest.fn(),
      markRead: jest.fn(),
      blockIps: jest.fn(),
      unblockIps: jest.fn(),
      markFalsePositive: jest.fn(),
    },
  },
}));

test('renders the responsive superadmin security alerts view', async () => {
  AdminApi.securityEvents.list.mockResolvedValue({
    items: [
      {
        id: 1,
        event_type: 'threat_detected',
        severity: 'high',
        risk_score: 90,
        is_blocked: true,
        status: 'new',
        ip_address: '127.0.0.1',
        attempts: 1,
      },
    ],
    unread: 1,
    critical: 0,
    blocked: 1,
    high_risk: 1,
    threat_summary: [],
  });
  render(<SecuritySettings />);

  fireEvent.click(
    screen.getByRole('button', { name: /xavfsizlik xabarlari/i })
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Risk balli: 90/i)).not.toBeNull();
    },
    { timeout: 3000 }
  );
});
