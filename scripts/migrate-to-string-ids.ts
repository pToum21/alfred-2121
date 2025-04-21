import { executeQuery } from '../lib/db';
import 'dotenv/config';

async function migrateTables() {
  try {
    console.log('Starting database migration...');

    // Drop existing tables in correct order
    await executeQuery('DROP TABLE IF EXISTS chat_messages CASCADE');
    await executeQuery('DROP TABLE IF EXISTS chats CASCADE');
    await executeQuery('DROP TABLE IF EXISTS user_preferences CASCADE');
    await executeQuery('DROP TABLE IF EXISTS sessions CASCADE');
    await executeQuery('DROP TABLE IF EXISTS users CASCADE');

    console.log('Dropped existing tables');

    // Create tables one by one
    await executeQuery(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        totp_secret VARCHAR(255),
        totp_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      CREATE TABLE sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      CREATE TABLE user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        preference_key VARCHAR(255) NOT NULL,
        preference_value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, preference_key)
      )
    `);

    await executeQuery(`
      CREATE TABLE chats (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        share_path VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      CREATE TABLE chat_messages (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(255) REFERENCES chats(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50),
        rating VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Created new tables');

    // Create indexes one by one
    await executeQuery('CREATE INDEX idx_sessions_token ON sessions(token)');
    await executeQuery('CREATE INDEX idx_sessions_user_id ON sessions(user_id)');
    await executeQuery('CREATE INDEX idx_chats_user_id ON chats(user_id)');
    await executeQuery('CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id)');

    console.log('Created indexes');
    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 