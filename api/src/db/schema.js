import { pgTable, text, integer, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role').notNull().default('lawyer'),
  client_id: text('client_id').references(() => clients.id),
  is_active: integer('is_active').notNull().default(1),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  group_name: text('group_name'),
  has_fixed_fee: integer('has_fixed_fee').notNull().default(1),
  monthly_fee: real('monthly_fee').notNull().default(0),
  hourly_rate: real('hourly_rate').notNull().default(175),
  carry_forward_balance: real('carry_forward_balance').notNull().default(0),
  notes: text('notes'),
  is_active: integer('is_active').notNull().default(1),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  lawyer_id: text('lawyer_id').notNull().references(() => users.id),
  client_id: text('client_id').notNull().references(() => clients.id),
  task_type: text('task_type').notNull(),
  description: text('description').notNull(),
  time_tenths: real('time_tenths').notNull(),
  hourly_rate_applied: real('hourly_rate_applied').notNull(),
  amount: real('amount').notNull(),
  month_period: text('month_period').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const billingRecords = pgTable('billing_records', {
  id: text('id').primaryKey(),
  client_id: text('client_id').notNull().references(() => clients.id),
  period: text('period').notNull(),
  fixed_fee: real('fixed_fee').notNull().default(0),
  total_consumed: real('total_consumed').notNull().default(0),
  excess_amount: real('excess_amount').notNull().default(0),
  total_invoiced: real('total_invoiced').notNull().default(0),
  amount_paid: real('amount_paid').notNull().default(0),
  payment_date: text('payment_date'),
  invoice_reference: text('invoice_reference'),
  invoice_link: text('invoice_link'),
  payment_status: text('payment_status').notNull().default('pending'),
  accumulated_total: real('accumulated_total').notNull().default(0),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
});

export const taskTypes = pgTable('task_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  is_active: integer('is_active').notNull().default(1),
  sort_order: integer('sort_order').notNull().default(0),
});
