'use client'

import { useState, KeyboardEvent } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { useActions, useUIState } from 'ai/rsc'
import type { AI } from '@/app/actions'
import { UserMessage } from './user-message'
import { Send } from 'lucide-react'

export function FollowupPanel() {
  const [input, setInput] = useState('')
  const { submit } = useActions()
  const [, setMessages] = useUIState<typeof AI>()

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    
    if (input.trim() === '') {
      return;
    }

    const formData = new FormData();
    formData.append('input', input);

    const responseMessage = await submit(formData);
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: Date.now(),
        isGenerating: false,
        component: <UserMessage message={input} />
      },
      responseMessage
    ]);

    setInput('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-24">
      {/* This component is now just a spacer to ensure proper bottom padding */}
    </div>
  )
}