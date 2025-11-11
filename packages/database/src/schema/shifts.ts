import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  employeeId: uuid('employee_id').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  breakMinutes: integer('break_minutes').notNull().default(0),
  status: text('status').notNull().default('scheduled'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
