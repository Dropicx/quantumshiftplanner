export const mockHealthResponse = {
  status: 'ok',
  timestamp: new Date().toISOString(),
};

export const mockDatabaseHealthy = {
  database: {
    status: 'up',
  },
};

export const mockDatabaseUnhealthy = {
  database: {
    status: 'down',
    error: 'Connection failed',
  },
};
