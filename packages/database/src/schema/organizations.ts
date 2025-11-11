import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrganizationId: text('clerk_organization_id').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  subscriptionTier: text('subscription_tier')
    .notNull()
    .default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
