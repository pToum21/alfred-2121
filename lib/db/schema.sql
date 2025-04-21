-- Drop existing tables if they exist
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS auth_audit_logs;
DROP TABLE IF EXISTS totp_setup_tokens;
DROP TABLE IF EXISTS user_totp;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create TOTP tables
CREATE TABLE user_totp (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  totp_secret TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE totp_setup_tokens (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  setup_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE auth_audit_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  email TEXT,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  preference_key VARCHAR(255) NOT NULL,
  preference_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, preference_key)
);

-- Create chats table with VARCHAR id
CREATE TABLE chats (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  share_path VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table with VARCHAR chat_id
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(255) REFERENCES chats(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50),
  rating VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_user_totp_user_id ON user_totp(user_id);
CREATE INDEX idx_totp_setup_tokens_user_id ON totp_setup_tokens(user_id);
CREATE INDEX idx_auth_audit_logs_user_id ON auth_audit_logs(user_id); 