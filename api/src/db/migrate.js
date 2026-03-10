import { sqlite } from './connection.js';

const statements = [
  // Users
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'lawyer',
    client_id TEXT REFERENCES clients(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

  // Clients
  `CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_name TEXT,
    has_fixed_fee INTEGER NOT NULL DEFAULT 1,
    monthly_fee REAL NOT NULL DEFAULT 0,
    hourly_rate REAL NOT NULL DEFAULT 175,
    carry_forward_balance REAL NOT NULL DEFAULT 0,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  // Tasks
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    lawyer_id TEXT NOT NULL REFERENCES users(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    task_type TEXT NOT NULL,
    description TEXT NOT NULL,
    time_tenths REAL NOT NULL,
    hourly_rate_applied REAL NOT NULL,
    amount REAL NOT NULL,
    month_period TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_client_period ON tasks(client_id, month_period)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_lawyer ON tasks(lawyer_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_period ON tasks(month_period)`,

  // Billing records
  `CREATE TABLE IF NOT EXISTS billing_records (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id),
    period TEXT NOT NULL,
    fixed_fee REAL NOT NULL DEFAULT 0,
    total_consumed REAL NOT NULL DEFAULT 0,
    excess_amount REAL NOT NULL DEFAULT 0,
    total_invoiced REAL NOT NULL DEFAULT 0,
    amount_paid REAL NOT NULL DEFAULT 0,
    payment_date TEXT,
    invoice_reference TEXT,
    invoice_link TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    accumulated_total REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_client_period ON billing_records(client_id, period)`,

  // Task types
  `CREATE TABLE IF NOT EXISTS task_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
];

console.log('Ejecutando migraciones...');
for (const sql of statements) {
  sqlite.exec(sql);
}
console.log('Migraciones completadas.');
process.exit(0);
