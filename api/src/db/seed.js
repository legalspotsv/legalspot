import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { sqlite } from './connection.js';

const now = new Date().toISOString();
const SALT_ROUNDS = 10;

async function seed() {
  console.log('Ejecutando seed...');

  // --- Task Types ---
  const taskTypeNames = [
    'Laboral / Notarial', 'Asesoría', 'Corporativo', 'Litigios', 'Registro',
    'Administrativo', 'Gestión', 'Traducción', 'Propiedad Intelectual',
    'Inmobiliario', 'NDA', 'CIT', 'Consentimiento Informado', 'Finiquito',
    'Denuncia', 'VoBo', 'Certificación Notarial', 'Orden de Descuento', 'VISADO',
  ];

  const insertTaskType = sqlite.prepare(
    'INSERT OR IGNORE INTO task_types (id, name, is_active, sort_order) VALUES (?, ?, 1, ?)'
  );
  for (let i = 0; i < taskTypeNames.length; i++) {
    insertTaskType.run(uuid(), taskTypeNames[i], i);
  }
  console.log(`  ${taskTypeNames.length} tipos de tarea creados`);

  // --- Clients ---
  const clientsData = [
    { name: 'Grupo BALU', has_fixed_fee: 1, monthly_fee: 1000, hourly_rate: 100, carry_forward_balance: 0, notes: 'Excedentes frecuentes. Saldo pendiente ~$2,244' },
    { name: 'Grupo ROMBAS', has_fixed_fee: 1, monthly_fee: 1000, hourly_rate: 100, carry_forward_balance: 0, notes: '3 meses pendientes de pago (~$3,000)' },
    { name: 'Horizon Global', has_fixed_fee: 1, monthly_fee: 1000, hourly_rate: 100, carry_forward_balance: 0, notes: 'Al día. Sin excedentes registrados' },
    { name: 'Orthoestetic', has_fixed_fee: 0, monthly_fee: 0, hourly_rate: 100, carry_forward_balance: 0, notes: 'No tiene fee fijo. Pago por consumo real' },
    { name: 'Herbert Corona', has_fixed_fee: 0, monthly_fee: 0, hourly_rate: 100, carry_forward_balance: 0, notes: 'Poder General Administrativo en trámite' },
  ];

  const insertClient = sqlite.prepare(
    `INSERT OR IGNORE INTO clients (id, name, group_name, has_fixed_fee, monthly_fee, hourly_rate, carry_forward_balance, notes, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  );

  const clientIds = {};
  for (const c of clientsData) {
    const id = uuid();
    clientIds[c.name] = id;
    insertClient.run(id, c.name, c.name, c.has_fixed_fee, c.monthly_fee, c.hourly_rate, c.carry_forward_balance, c.notes, now, now);
  }
  console.log(`  ${clientsData.length} clientes creados`);

  // --- Users ---
  const adminHash = await bcrypt.hash('admin2024', SALT_ROUNDS);
  const lawyerHash = await bcrypt.hash('abogado2024', SALT_ROUNDS);
  const clientHash = await bcrypt.hash('cliente2024', SALT_ROUNDS);

  const insertUser = sqlite.prepare(
    `INSERT OR IGNORE INTO users (id, name, email, password_hash, role, client_id, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  );

  // Admins
  insertUser.run(uuid(), 'Javier', 'javier@legalspot.sv', adminHash, 'admin', null, now, now);
  insertUser.run(uuid(), 'Candy', 'candy@legalspot.sv', adminHash, 'admin', null, now, now);
  insertUser.run(uuid(), 'Admin', 'admin@legalspot.sv', adminHash, 'admin', null, now, now);

  // Lawyers
  insertUser.run(uuid(), 'Alan', 'alan@legalspot.sv', lawyerHash, 'lawyer', null, now, now);
  insertUser.run(uuid(), 'Nahum', 'nahum@legalspot.sv', lawyerHash, 'lawyer', null, now, now);
  insertUser.run(uuid(), 'Michelle', 'michelle@legalspot.sv', lawyerHash, 'lawyer', null, now, now);

  // Client portal users
  insertUser.run(uuid(), 'Grupo BALU (Portal)', 'balu@cliente.com', clientHash, 'client', clientIds['Grupo BALU'], now, now);
  insertUser.run(uuid(), 'Horizon Global (Portal)', 'horizon@cliente.com', clientHash, 'client', clientIds['Horizon Global'], now, now);

  console.log('  Usuarios creados (3 admin, 3 abogados, 2 clientes)');
  console.log('Seed completado.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
