'use server'

import { executeQuery } from '@/lib/db';
import { Chat, AIMessage } from '@/lib/types';
import { getCurrentUserFromToken } from '@/lib/auth/auth';
import { cookies } from 'next/headers';

export async function saveChat(chat: Chat) {
  console.log(`Saving chat ${chat.id}...`);
  
  // Get token and user ID
  const token = cookies().get('token')?.value;
  const userId = await getCurrentUserFromToken(token);
  
  if (!userId) {
    console.log('User not authenticated');
    throw new Error('User not authenticated');
  }

  try {
    // First, save or update the chat
    const existingChats = await executeQuery<{ id: string }>(
      'SELECT id FROM chats WHERE id = $1',
      [chat.id]
    );

    if (existingChats.length === 0) {
      // Insert new chat
      await executeQuery(
        `INSERT INTO chats (id, user_id, title, share_path, created_at, updated_at)
         VALUES ($1, $2::integer, $3, $4, $5, $6)`,
        [
          chat.id,
          parseInt(userId),
          chat.title,
          chat.path,
          chat.createdAt,
          new Date()
        ]
      );
    } else {
      // Update existing chat
      await executeQuery(
        `UPDATE chats 
         SET title = $1, share_path = $2, updated_at = $3
         WHERE id = $4`,
        [chat.title, chat.path, new Date(), chat.id]
      );
    }

    // Delete existing messages for this chat
    await executeQuery(
      'DELETE FROM chat_messages WHERE chat_id = $1',
      [chat.id]
    );

    // Insert all messages
    for (const message of chat.messages) {
      await executeQuery(
        `INSERT INTO chat_messages (chat_id, role, content, type, rating)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          chat.id,
          message.role,
          typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
          message.type || null,
          message.rating || null
        ]
      );
    }

    console.log(`Chat ${chat.id} saved successfully`);
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}

export async function getChat(chatId: string): Promise<Chat | null> {
  try {
    // Get token and user ID
    const token = cookies().get('token')?.value;
    const userId = await getCurrentUserFromToken(token);
    
    if (!userId) {
      console.log('User not authenticated');
      return null;
    }

    const chats = await executeQuery<Chat>(
      `SELECT id, user_id, title, share_path as path, created_at as "createdAt"
       FROM chats 
       WHERE id = $1 AND user_id = $2::integer`,
      [chatId, parseInt(userId)]
    );

    if (!chats.length) {
      return null;
    }

    const chat = chats[0];

    const messages = await executeQuery<AIMessage>(
      `SELECT role, content, type, rating
       FROM chat_messages 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );

    return {
      ...chat,
      messages
    };
  } catch (error) {
    console.error('Error getting chat:', error);
    return null;
  }
}

export async function getChats(): Promise<Chat[]> {
  try {
    // Get token and user ID
    const token = cookies().get('token')?.value;
    const userId = await getCurrentUserFromToken(token);
    
    if (!userId) {
      console.log('User not authenticated');
      return [];
    }

    const chats = await executeQuery<Chat>(
      `SELECT id, title, share_path as path, created_at as "createdAt"
       FROM chats 
       WHERE user_id = $1::integer
       ORDER BY created_at DESC`,
      [parseInt(userId)]
    );

    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
}

export async function deleteChat(chatId: string): Promise<boolean> {
  try {
    // Get token and user ID
    const token = cookies().get('token')?.value;
    const userId = await getCurrentUserFromToken(token);
    
    if (!userId) {
      console.log('User not authenticated');
      return false;
    }

    await executeQuery(
      'DELETE FROM chats WHERE id = $1 AND user_id = $2::integer',
      [chatId, parseInt(userId)]
    );

    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    return false;
  }
}

export async function getSharedChat(chatId: string): Promise<Chat | null> {
  try {
    // For shared chats, we don't need user authentication
    const chats = await executeQuery<Chat>(
      `SELECT id, user_id, title, share_path as path, created_at as "createdAt"
       FROM chats 
       WHERE id = $1 AND share_path IS NOT NULL`,
      [chatId]
    );

    if (!chats.length) {
      return null;
    }

    const chat = chats[0];

    const messages = await executeQuery<AIMessage>(
      `SELECT role, content, type, rating
       FROM chat_messages 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );

    return {
      ...chat,
      messages,
      currentSearchResults: [] // Empty search results for shared chats
    };
  } catch (error) {
    console.error('Error getting shared chat:', error);
    return null;
  }
}

export async function shareChat(chatId: string): Promise<Chat | null> {
  try {
    // Get token and user ID
    const token = cookies().get('token')?.value;
    const userId = await getCurrentUserFromToken(token);
    
    if (!userId) {
      console.log('User not authenticated');
      return null;
    }

    // Generate a unique share path
    const sharePath = `/share/${chatId}`;

    // Update the chat with the share path
    await executeQuery(
      `UPDATE chats 
       SET share_path = $1
       WHERE id = $2 AND user_id = $3::integer`,
      [sharePath, chatId, parseInt(userId)]
    );

    // Get the updated chat
    const chats = await executeQuery<Chat>(
      `SELECT id, user_id, title, share_path as path, created_at as "createdAt"
       FROM chats 
       WHERE id = $1 AND user_id = $2::integer`,
      [chatId, parseInt(userId)]
    );

    if (!chats.length) {
      return null;
    }

    const chat = chats[0];

    const messages = await executeQuery<AIMessage>(
      `SELECT role, content, type, rating
       FROM chat_messages 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );

    return {
      ...chat,
      messages,
      sharePath
    };
  } catch (error) {
    console.error('Error sharing chat:', error);
    return null;
  }
}

export async function clearChats(): Promise<{ error?: string }> {
  try {
    // Get token and user ID
    const token = cookies().get('token')?.value;
    const userId = await getCurrentUserFromToken(token);
    
    if (!userId) {
      console.log('User not authenticated');
      return { error: 'User not authenticated' };
    }

    // Delete all chats for the user
    await executeQuery(
      `DELETE FROM chats 
       WHERE user_id = $1::integer`,
      [parseInt(userId)]
    );

    console.log('Cleared all chats for user:', userId);
    return {};
  } catch (error) {
    console.error('Error clearing chats:', error);
    return { error: 'Failed to clear chat history' };
  }
}