import db from './connection';
import bcrypt from 'bcryptjs';

console.log('[Seed] Starting ShadowGuard database seed...');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Function to reset all tables
function resetDatabase() {
  db.exec(`
    DELETE FROM harness_traces;
    DELETE FROM data_security_logs;
    DELETE FROM risk_assessments;
    DELETE FROM ai_interactions;
    DELETE FROM policies;
    DELETE FROM users;
    DELETE FROM audit_logs;
    DELETE FROM organization_settings;
    DELETE FROM sqlite_sequence;
  `);
}

resetDatabase();

// Default password hash for 'password123'
const defaultPasswordHash = bcrypt.hashSync('password123', 10);

// 1. Seed Users (1-2 Admins, 3-4 Regular Employee Users)
const users = [
  {
    name: 'Sarah Connor',
    email: 'admin@shadowguard.local',
    password_hash: defaultPasswordHash,
    role: 'admin',
    department: 'Engineering',
    created_at: '2026-08-01 09:00:00',
  },
  {
    name: 'Sarah Connor (io)',
    email: 'sarah.connor@shadowguard.io',
    password_hash: defaultPasswordHash,
    role: 'admin',
    department: 'Engineering',
    created_at: '2026-08-01 09:00:00',
  },
  {
    name: 'Alex Mercer',
    email: 'alex.mercer@shadowguard.local',
    password_hash: defaultPasswordHash,
    role: 'user',
    department: 'Engineering',
    created_at: '2026-08-05 10:30:00',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@shadowguard.local',
    password_hash: defaultPasswordHash,
    role: 'user',
    department: 'Finance',
    created_at: '2026-08-10 11:15:00',
  },
  {
    name: 'David Chen',
    email: 'david.chen@shadowguard.local',
    password_hash: defaultPasswordHash,
    role: 'user',
    department: 'Product',
    created_at: '2026-08-15 14:00:00',
  },
  {
    name: 'Maya Patel',
    email: 'maya.patel@shadowguard.local',
    password_hash: defaultPasswordHash,
    role: 'user',
    department: 'Marketing',
    created_at: '2026-08-20 16:45:00',
  },
];

const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, department, created_at)
  VALUES (@name, @email, @password_hash, @role, @department, @created_at)
`);

for (const user of users) {
  insertUser.run(user);
}

// 2. Seed Policies (8 exact policy names)
const policies = [
  {
    name: 'Confidential Document Block',
    description:
      'Prevents uploading or pasting internal NDA/Confidential documents to public LLM endpoints.',
    scope: 'Organization-Wide',
    rule_count: 5,
    violation_count: 14,
    status: 'enabled',
    updated_at: '2026-08-25 10:00:00',
  },
  {
    name: 'Enterprise AI Usage Policy',
    description: 'Enforces acceptable use guidelines and rate limiting for external LLMs.',
    scope: 'Organization-Wide',
    rule_count: 8,
    violation_count: 27,
    status: 'enabled',
    updated_at: '2026-08-26 11:30:00',
  },
  {
    name: 'Financial Data Restriction',
    description: 'Blocks exposure of bank accounts, revenue numbers, and quarterly forecasts.',
    scope: 'Finance, Product',
    rule_count: 4,
    violation_count: 9,
    status: 'enabled',
    updated_at: '2026-08-27 14:15:00',
  },
  {
    name: 'HR Data Processing',
    description:
      'Restricts uploading employee PII, salary bands, and performance reviews to non-vetted tools.',
    scope: 'HR',
    rule_count: 6,
    violation_count: 12,
    status: 'enabled',
    updated_at: '2026-08-28 09:45:00',
  },
  {
    name: 'Marketing Content Generation',
    description: 'Monitors AI-generated marketing copy for copyright and trademark compliance.',
    scope: 'Marketing',
    rule_count: 3,
    violation_count: 4,
    status: 'enabled',
    updated_at: '2026-08-29 16:00:00',
  },
  {
    name: 'PII Data Protection',
    description: 'Redacts SSNs, credit cards, emails, and phone numbers prior to LLM submission.',
    scope: 'Organization-Wide',
    rule_count: 12,
    violation_count: 38,
    status: 'enabled',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    name: 'Source Code Guard',
    description:
      'Scans for API keys, DB passwords, and sensitive proprietary algorithms in code prompts.',
    scope: 'Engineering',
    rule_count: 10,
    violation_count: 22,
    status: 'enabled',
    updated_at: '2026-08-31 13:20:00',
  },
  {
    name: 'Third-Party AI Allowlist',
    description: 'Restricts AI usage exclusively to approved vendor endpoints with active DPAs.',
    scope: 'Organization-Wide',
    rule_count: 2,
    violation_count: 5,
    status: 'disabled',
    updated_at: '2026-09-01 15:10:00',
  },
];

const insertPolicy = db.prepare(`
  INSERT INTO policies (name, description, scope, rule_count, violation_count, status, updated_at)
  VALUES (@name, @description, @scope, @rule_count, @violation_count, @status, @updated_at)
`);

for (const policy of policies) {
  insertPolicy.run(policy);
}

// 3. Seed AI Interactions (Exact 87 items: 57 allowed, 18 restricted, 12 blocked)
const departments = ['Engineering', 'Marketing', 'HR', 'Finance', 'Product'] as const;
const targetApps = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity'] as const;
const userNames = ['Sarah Connor', 'Alex Mercer', 'Elena Rostova', 'David Chen', 'Maya Patel'];

// Templates for prompt summaries & categories
const promptTemplates = [
  { cat: 'Code Refactoring', summary: 'Refactor TypeScript async handler for caching layer' },
  { cat: 'API Key Processing', summary: 'Check AWS key formatting against regex' },
  {
    cat: 'Customer Support Analysis',
    summary: 'Summarize user feedback tickets for release notes',
  },
  { cat: 'Financial Forecasting', summary: 'Generate Q3 revenue projection spreadsheet formulas' },
  { cat: 'Employee Performance Notes', summary: 'Draft annual performance review template for HR' },
  {
    cat: 'Marketing Copy',
    summary: 'Create social media headlines for new security product launch',
  },
  { cat: 'Database Migration', summary: 'Generate Postgres to SQLite schema migration script' },
  {
    cat: 'Competitor Analysis',
    summary: 'Analyze public features of competing cloud security vendors',
  },
  { cat: 'Documentation', summary: 'Format OpenAPI 3.0 specification for internal gateway' },
  {
    cat: 'Salary Benchmark',
    summary: 'Compare engineering compensation bands against market data',
  },
];

const now = Date.now();
const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

// Decisions array: 57 allowed, 18 restricted, 12 blocked = 87 items total
const decisionsDistribution: ('allowed' | 'restricted' | 'blocked')[] = [
  ...Array(57).fill('allowed'),
  ...Array(18).fill('restricted'),
  ...Array(12).fill('blocked'),
];

const insertInteraction = db.prepare(`
  INSERT INTO ai_interactions (user_name, department, target_app, category, prompt_summary, risk_tier, decision, created_at)
  VALUES (@user_name, @department, @target_app, @category, @prompt_summary, @risk_tier, @decision, @created_at)
`);

const insertRiskAssessment = db.prepare(`
  INSERT INTO risk_assessments (interaction_id, score, tier, top_factors, created_at)
  VALUES (@interaction_id, @score, @tier, @top_factors, @created_at)
`);

const insertDataSecurityLog = db.prepare(`
  INSERT INTO data_security_logs (interaction_id, category, matched_pattern, action, created_at)
  VALUES (@interaction_id, @category, @matched_pattern, @action, @created_at)
`);

const insertHarnessTrace = db.prepare(`
  INSERT INTO harness_traces (interaction_id, workflow_path, explanation, agent_used, verification_used, created_at)
  VALUES (@interaction_id, @workflow_path, @explanation, @agent_used, @verification_used, @created_at)
`);

for (let i = 0; i < 87; i++) {
  const decision = decisionsDistribution[i];
  const department = departments[i % departments.length];
  const targetApp = targetApps[i % targetApps.length];
  const userName = userNames[i % userNames.length];
  const template = promptTemplates[i % promptTemplates.length];

  let riskTier: 'Low' | 'Medium' | 'High' | 'Critical';
  if (decision === 'allowed') {
    riskTier = i % 4 === 0 ? 'Medium' : 'Low';
  } else if (decision === 'restricted') {
    riskTier = i % 2 === 0 ? 'High' : 'Medium';
  } else {
    riskTier = i % 2 === 0 ? 'Critical' : 'High';
  }

  const randomOffset = Math.floor((i / 87) * fourteenDaysMs + (i % 7) * 3600000);
  const interactionTime = new Date(now - fourteenDaysMs + randomOffset)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);

  const interactionResult = insertInteraction.run({
    user_name: userName,
    department,
    target_app: targetApp,
    category: template.cat,
    prompt_summary: `${template.summary} (#${i + 1})`,
    risk_tier: riskTier,
    decision,
    created_at: interactionTime,
  });

  const interactionId = interactionResult.lastInsertRowid as number;

  if (decision === 'restricted' || decision === 'blocked') {
    const score = decision === 'blocked' ? 80 + (i % 19) : 55 + (i % 20);
    const topFactors =
      decision === 'blocked'
        ? JSON.stringify(['PII Exposure', 'Hardcoded Secret', 'Unapproved LLM'])
        : JSON.stringify(['Financial Keyword', 'Internal Document Pattern']);

    insertRiskAssessment.run({
      interaction_id: interactionId,
      score,
      tier: riskTier,
      top_factors: topFactors,
      created_at: interactionTime,
    });

    const secCategory =
      i % 4 === 0 ? 'PII' : i % 4 === 1 ? 'SourceCode' : i % 4 === 2 ? 'Financial' : 'Confidential';

    const matchedPattern =
      secCategory === 'PII'
        ? 'SSN_REGEX_MATCH'
        : secCategory === 'SourceCode'
          ? 'AWS_SECRET_ACCESS_KEY'
          : secCategory === 'Financial'
            ? 'REVENUE_PROJECTION_TABLE'
            : 'INTERNAL_CONFIDENTIAL_STAMP';

    const secAction = decision === 'blocked' ? 'Blocked' : 'Redacted';

    insertDataSecurityLog.run({
      interaction_id: interactionId,
      category: secCategory,
      matched_pattern: matchedPattern,
      action: secAction,
      created_at: interactionTime,
    });

    insertHarnessTrace.run({
      interaction_id: interactionId,
      workflow_path: JSON.stringify(['Ingest', 'DLP_Scan', 'Policy_Check', 'Harness_Verify']),
      explanation: `Harness evaluated rule set and determined decision=${decision} due to ${secCategory} exposure.`,
      agent_used: 'ShadowGuard-Sentinel-V1',
      verification_used: 1,
      created_at: interactionTime,
    });
  }
}

// 4. Seed Audit Logs (12 entries)
const auditLogs = [
  {
    actor: 'Sarah Connor',
    action: 'Policy Updated',
    target: 'Source Code Guard',
    severity: 'info',
    ip_address: '192.168.1.45',
    created_at: '2026-08-25 10:05:00',
  },
  {
    actor: 'Alex Mercer',
    action: 'Critical Detection',
    target: 'Interaction #42 (AWS Key Exposure)',
    severity: 'critical',
    ip_address: '10.0.4.12',
    created_at: '2026-08-26 14:22:10',
  },
  {
    actor: 'System Firewall',
    action: 'Access Denied',
    target: 'ChatGPT API Endpoint',
    severity: 'warning',
    ip_address: '10.0.1.100',
    created_at: '2026-08-27 08:15:30',
  },
  {
    actor: 'Unknown',
    action: 'Login Failed',
    target: 'Admin Portal (/login)',
    severity: 'warning',
    ip_address: '198.51.100.44',
    created_at: '2026-08-28 02:40:11',
  },
  {
    actor: 'Elena Rostova',
    action: 'Policy Updated',
    target: 'PII Data Protection',
    severity: 'info',
    ip_address: '192.168.1.88',
    created_at: '2026-08-29 11:12:00',
  },
  {
    actor: 'Sarah Connor',
    action: 'Critical Detection',
    target: 'Interaction #68 (Employee SSN Redacted)',
    severity: 'critical',
    ip_address: '192.168.1.45',
    created_at: '2026-08-30 15:50:22',
  },
  {
    actor: 'System Sentinel',
    action: 'Access Denied',
    target: 'Unauthorized Gemini Endpoint',
    severity: 'warning',
    ip_address: '10.0.2.14',
    created_at: '2026-08-31 09:05:44',
  },
  {
    actor: 'David Chen',
    action: 'Login Failed',
    target: 'Analyst Dashboard',
    severity: 'info',
    ip_address: '172.16.0.5',
    created_at: '2026-09-01 13:30:00',
  },
  {
    actor: 'Alex Mercer',
    action: 'Policy Updated',
    target: 'Confidential Document Block',
    severity: 'info',
    ip_address: '10.0.4.12',
    created_at: '2026-09-02 16:20:05',
  },
  {
    actor: 'System Firewall',
    action: 'Critical Detection',
    target: 'Interaction #79 (Financial Projection Leak)',
    severity: 'critical',
    ip_address: '10.0.1.100',
    created_at: '2026-09-03 18:00:55',
  },
  {
    actor: 'Maya Patel',
    action: 'Login Failed',
    target: 'Viewer Portal',
    severity: 'info',
    ip_address: '172.16.0.12',
    created_at: '2026-09-04 10:14:00',
  },
  {
    actor: 'Sarah Connor',
    action: 'Policy Updated',
    target: 'Third-Party AI Allowlist',
    severity: 'warning',
    ip_address: '192.168.1.45',
    created_at: '2026-09-05 17:00:00',
  },
];

const insertAuditLog = db.prepare(`
  INSERT INTO audit_logs (actor, action, target, severity, ip_address, created_at)
  VALUES (@actor, @action, @target, @severity, @ip_address, @created_at)
`);

for (const log of auditLogs) {
  insertAuditLog.run(log);
}

// 5. Seed Organization Settings (1 entry)
db.prepare(
  `
  INSERT INTO organization_settings (retention_days, webhook_slack, webhook_email)
  VALUES (365, 'https://hooks.slack.com/services/T00/B00/XXXX', 'security-alerts@shadowguard.io')
`
).run();

console.log('[Seed] Database seeding completed successfully!\n');

const tables = [
  'users',
  'ai_interactions',
  'policies',
  'risk_assessments',
  'data_security_logs',
  'harness_traces',
  'audit_logs',
  'organization_settings',
];

console.log('=== ShadowGuard Database Row Counts ===');
for (const table of tables) {
  const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
  console.log(`- ${table}: ${countRow.count} rows`);
}
console.log('=======================================');
