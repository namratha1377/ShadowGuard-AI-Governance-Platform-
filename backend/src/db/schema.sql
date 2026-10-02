PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'user')) NOT NULL,
  department TEXT CHECK(department IN ('Engineering', 'Marketing', 'HR', 'Finance', 'Product')) DEFAULT 'Engineering',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_interactions (
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

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  scope TEXT NOT NULL,
  rule_count INTEGER DEFAULT 1,
  violation_count INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('enabled', 'disabled')) DEFAULT 'enabled',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interaction_id INTEGER NOT NULL REFERENCES ai_interactions(id) ON DELETE CASCADE,
  score INTEGER CHECK(score >= 0 AND score <= 100) NOT NULL,
  tier TEXT CHECK(tier IN ('Low', 'Medium', 'High', 'Critical')) NOT NULL,
  top_factors TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_security_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interaction_id INTEGER NOT NULL REFERENCES ai_interactions(id) ON DELETE CASCADE,
  category TEXT CHECK(category IN ('PII', 'SourceCode', 'Financial', 'Confidential')) NOT NULL,
  matched_pattern TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS harness_traces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interaction_id INTEGER NOT NULL REFERENCES ai_interactions(id) ON DELETE CASCADE,
  workflow_path TEXT NOT NULL,
  explanation TEXT NOT NULL,
  agent_used TEXT NOT NULL,
  verification_used BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('info', 'warning', 'critical')) NOT NULL,
  ip_address TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  retention_days INTEGER DEFAULT 365,
  webhook_slack TEXT,
  webhook_email TEXT
);

-- Indexes for performance optimization on frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_department ON ai_interactions(department);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_decision ON ai_interactions(decision);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_target_app ON ai_interactions(target_app);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_interaction_id ON risk_assessments(interaction_id);
CREATE INDEX IF NOT EXISTS idx_data_security_logs_interaction_id ON data_security_logs(interaction_id);
CREATE INDEX IF NOT EXISTS idx_data_security_logs_category ON data_security_logs(category);
CREATE INDEX IF NOT EXISTS idx_harness_traces_interaction_id ON harness_traces(interaction_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
