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
  billing_type: text('billing_type').notNull().default('hourly'), // 'hourly' | 'process'
  has_fixed_fee: integer('has_fixed_fee').notNull().default(1),   // solo para tipo hourly
  monthly_fee: real('monthly_fee').notNull().default(0),          // retainer mensual
  hourly_rate: real('hourly_rate').notNull().default(175),
  carry_forward_balance: real('carry_forward_balance').notNull().default(0),
  assigned_lawyer_id: text('assigned_lawyer_id'),                 // abogado asignado
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

// Procesos — para clientes tipo 'process'
export const processes = pgTable('processes', {
  id: text('id').primaryKey(),
  client_id: text('client_id').notNull().references(() => clients.id),
  name: text('name').notNull(),
  description: text('description'),
  fixed_amount: real('fixed_amount').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'closed'
  created_by: text('created_by').references(() => users.id),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Hitos — dentro de un proceso
export const milestones = pgTable('milestones', {
  id: text('id').primaryKey(),
  process_id: text('process_id').notNull().references(() => processes.id),
  title: text('title').notNull(),
  description: text('description'),
  completed_at: text('completed_at'),  // null = pendiente
  created_by: text('created_by').references(() => users.id),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Documentos — nube de documentos por cliente
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  client_id: text('client_id').notNull().references(() => clients.id),
  process_id: text('process_id').references(() => processes.id), // opcional
  name: text('name').notNull(),
  description: text('description'),
  file_url: text('file_url').notNull(),  // URL del archivo (Google Drive, Supabase Storage, etc.)
  cloud_type: text('cloud_type').notNull().default('firm'), // 'firm' | 'client'
  uploaded_by: text('uploaded_by').references(() => users.id),
  created_at: text('created_at').notNull(),
});
