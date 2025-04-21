import React from 'react';
import { ChatShare } from './chat-share';

type UserMessageProps = {
  message: string;
  chatId?: string;
  showShare?: boolean;
};

export const UserMessage: React.FC<UserMessageProps> = ({
  message,
  chatId,
  showShare = false,
}) => {
  const enableShare = process.env.ENABLE_SHARE === 'true';
  return (
    <div className="flex flex-col w-full space-y-2 mt-2">
      <div className="text-3xl flex-1 break-words w-full text-gray-900 dark:text-gray-100">{message}</div>
      {enableShare && showShare && chatId && <ChatShare chatId={chatId} />}
    </div>
  );
};