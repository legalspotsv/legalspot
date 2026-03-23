-- LegalSpot Migration: v2
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas nuevas a clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS assigned_lawyer_id TEXT REFERENCES users(id);

-- 2. Tabla de procesos (para clientes tipo 'process')
CREATE TABLE IF NOT EXISTS processes (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  description TEXT,
  fixed_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Tabla de hitos (dentro de un proceso)
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed_at TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Tabla de documentos (nube de documentos)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  process_id TEXT REFERENCES processes(id),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  cloud_type TEXT NOT NULL DEFAULT 'firm',
  uploaded_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);
