import { pgTable, text, timestamp, uuid, numeric } from 'drizzle-orm/pg-core';

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  employeeNumber: text('employee_number'),
  phone: text('phone'),
  position: text('position'),
  department: text('department'),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  status: text('status').notNull().default('active'),
  hireDate: timestamp('hire_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
