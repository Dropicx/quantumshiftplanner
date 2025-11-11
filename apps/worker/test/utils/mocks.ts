export const mockRedisConfig = {
  host: 'localhost',
  port: 6379,
};

export const mockEmailJob = {
  type: 'shift-assigned' as const,
  to: 'test@example.com',
  subject: 'Test Email Subject',
  data: { shiftId: '123', shiftDate: '2025-01-15' },
};

export const mockNotificationJob = {
  type: 'shift-update' as const,
  userId: 'user-123',
  title: 'Shift Updated',
  body: 'Your shift has been modified',
  data: { shiftId: '123' },
};

export const mockReportJob = {
  type: 'payroll' as const,
  organizationId: 'org-123',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  data: {},
};
