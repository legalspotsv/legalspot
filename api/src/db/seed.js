import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
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

  for (let i = 0; i < taskTypeNames.length; i++) {
    await sql`INSERT INTO task_types (id, name, is_active, sort_order) VALUES (${uuid()}, ${taskTypeNames[i]}, 1, ${i}) ON CONFLICT (name) DO NOTHING`;
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

  const clientIds = {};
  for (const c of clientsData) {
    const id = uuid();
    clientIds[c.name] = id;
    await sql`INSERT INTO clients (id, name, group_name, has_fixed_fee, monthly_fee, hourly_rate, carry_forward_balance, notes, is_active, created_at, updated_at)
      VALUES (${id}, ${c.name}, ${c.name}, ${c.has_fixed_fee}, ${c.monthly_fee}, ${c.hourly_rate}, ${c.carry_forward_balance}, ${c.notes}, 1, ${now}, ${now})
      ON CONFLICT (id) DO NOTHING`;
  }
  console.log(`  ${clientsData.length} clientes creados`);

  // --- Users ---
  const adminHash = await bcrypt.hash('admin2024', SALT_ROUNDS);
  const lawyerHash = await bcrypt.hash('abogado2024', SALT_ROUNDS);
  const clientHash = await bcrypt.hash('cliente2024', SALT_ROUNDS);

  const users = [
    { name: 'Javier', email: 'javier@legalspot.sv', hash: adminHash, role: 'admin', client_id: null },
    { name: 'Candy', email: 'candy@legalspot.sv', hash: adminHash, role: 'admin', client_id: null },
    { name: 'Admin', email: 'admin@legalspot.sv', hash: adminHash, role: 'admin', client_id: null },
    { name: 'Alan', email: 'alan@legalspot.sv', hash: lawyerHash, role: 'lawyer', client_id: null },
    { name: 'Nahum', email: 'nahum@legalspot.sv', hash: lawyerHash, role: 'lawyer', client_id: null },
    { name: 'Michelle', email: 'michelle@legalspot.sv', hash: lawyerHash, role: 'lawyer', client_id: null },
    { name: 'Grupo BALU (Portal)', email: 'balu@cliente.com', hash: clientHash, role: 'client', client_id: clientIds['Grupo BALU'] },
    { name: 'Horizon Global (Portal)', email: 'horizon@cliente.com', hash: clientHash, role: 'client', client_id: clientIds['Horizon Global'] },
  ];

  for (const u of users) {
    await sql`INSERT INTO users (id, name, email, password_hash, role, client_id, is_active, created_at, updated_at)
      VALUES (${uuid()}, ${u.name}, ${u.email}, ${u.hash}, ${u.role}, ${u.client_id}, 1, ${now}, ${now})
      ON CONFLICT DO NOTHING`;
  }

  console.log('  Usuarios creados (3 admin, 3 abogados, 2 clientes)');
  console.log('Seed completado.');
  await sql.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('Error en seed:', err);
  await sql.end();
  process.exit(1);
});
