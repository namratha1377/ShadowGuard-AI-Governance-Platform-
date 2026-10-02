import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../shadowguard.db');
export const db = new Database(dbPath);

// Enable Foreign Keys and WAL Mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Execute schema.sql to ensure database structure exists
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Migrate existing users table if it contains old analyst/viewer roles or lacks new CHECK constraint
try {
  const userTableInfo = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
    .get() as { sql: string } | undefined;

  if (userTableInfo && (userTableInfo.sql.includes('analyst') || !userTableInfo.sql.includes('department'))) {
    const cols = (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map(
      (c) => c.name
    );
    const hasDept = cols.includes('department');
    const deptExpr = hasDept ? "COALESCE(department, 'Engineering')" : "'Engineering'";

    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS users_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'user')) NOT NULL,
        department TEXT CHECK(department IN ('Engineering', 'Marketing', 'HR', 'Finance', 'Product')) DEFAULT 'Engineering',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO users_v2 (id, name, email, password_hash, role, department, created_at)
      SELECT id, name, email, password_hash, CASE WHEN role IN ('analyst', 'viewer') THEN 'user' ELSE role END, ${deptExpr}, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_v2 RENAME TO users;
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      PRAGMA foreign_keys = ON;
    `);
    console.log('[Database Migration] Users table migrated to 2-role schema (admin, user) with department');
  } else {
    // In case any rows need update
    try {
      db.prepare("UPDATE users SET role = 'user' WHERE role IN ('analyst', 'viewer')").run();
    } catch {
      // ignore if check constraint prevents it
    }
  }
} catch (migErr) {
  console.error('[Database Migration] Error during user table migration:', migErr);
}

// Ensure ai_interactions has status, suggested_decision, review_note, user_id, file_name, and expanded decision CHECK
try {
  const tableSql = (
    db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='ai_interactions'").get() as any
  )?.sql || '';

  if (!tableSql.includes('status') || !tableSql.includes('rejected')) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS ai_interactions_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        department TEXT CHECK(department IN ('Engineering', 'Marketing', 'HR', 'Finance', 'Product')) NOT NULL,
        target_app TEXT CHECK(target_app IN ('ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity')) NOT NULL,
        category TEXT NOT NULL,
        prompt_summary TEXT NOT NULL,
        risk_tier TEXT CHECK(risk_tier IN ('Low', 'Medium', 'High', 'Critical')) NOT NULL,
        decision TEXT CHECK(decision IN ('allowed', 'restricted', 'blocked', 'rejected', 'pending')) NOT NULL,
        status TEXT CHECK(status IN ('analyzing', 'pending_review', 'allowed', 'rejected', 'blocked', 'restricted')) DEFAULT 'allowed',
        suggested_decision TEXT,
        review_note TEXT,
        file_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO ai_interactions_v2 (id, user_name, department, target_app, category, prompt_summary, risk_tier, decision, status, file_name, created_at)
      SELECT id, user_name, department, target_app, category, prompt_summary, risk_tier, decision, decision, file_name, created_at FROM ai_interactions;
      DROP TABLE ai_interactions;
      ALTER TABLE ai_interactions_v2 RENAME TO ai_interactions;
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_department ON ai_interactions(department);
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_decision ON ai_interactions(decision);
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_status ON ai_interactions(status);
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_target_app ON ai_interactions(target_app);
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);
      PRAGMA foreign_keys = ON;
    `);
    console.log('[Database Migration] Migrated ai_interactions with status, suggested_decision, and expanded decision constraints');
  }
} catch (e) {
  console.error('[Database Migration] Error migrating ai_interactions:', e);
}

export default db;

