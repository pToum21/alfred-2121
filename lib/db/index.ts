import { drizzle } from 'drizzle-orm/node-postgres';
import { getPool } from './db';

export const dynamic = 'force-dynamic';

// We only want to initialize these when actually making database calls
let db: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!db) {
    db = drizzle(getPool());
  }
  return db;
}

export async function executeQuery<T extends Record<string, any>>(
  query: string,
  params?: any[]
): Promise<T[]> {
  try {
    const result = await getPool().query(query, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Create tables if they don't exist
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        totp_secret VARCHAR(255),
        totp_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        preference_key VARCHAR(255) NOT NULL,
        preference_value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, preference_key)
      );

      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        share_path VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(255) REFERENCES chats(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50),
        rating VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_totp (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        totp_secret TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 3,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS totp_setup_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        setup_token TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 3,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS auth_audit_logs (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        email TEXT,
        success BOOLEAN NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS two_factor_domains (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add initial 2FA domains if they don't exist
    await getPool().query(`
      INSERT INTO two_factor_domains (domain) 
      VALUES ('situsamc.com'), ('impactcapitoldc.com')
      ON CONFLICT (domain) DO NOTHING;
    `);

    // Create indexes if they don't exist
    await getPool().query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_user_totp_user_id ON user_totp(user_id);
      CREATE INDEX IF NOT EXISTS idx_totp_setup_tokens_user_id ON totp_setup_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_totp_setup_tokens_expires_at ON totp_setup_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_two_factor_domains_domain ON two_factor_domains(domain);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 