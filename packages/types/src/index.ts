// Common types shared across the application

export interface User {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  clerkOrganizationId: string;
  name: string;
  slug: string;
  subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  userId: string;
  organizationId: string;
  employeeNumber: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  hourlyRate: number | null;
  status: 'active' | 'inactive' | 'terminated';
  hireDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  organizationId: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
