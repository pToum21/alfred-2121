'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Section } from './section';
import { StreamableValue, useStreamableValue } from 'ai/rsc';
import { BotMessage } from './message';
import { Sparkles, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export type AnswerSectionProps = {
  result: StreamableValue<string>;
  hasHeader?: boolean;
};

export function AnswerSection({
  result,
  hasHeader = true,
}: AnswerSectionProps) {
  const [data] = useStreamableValue(result);

  if (!data?.trim()) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(data || '');
    toast.success('Copied to clipboard');
  };

  const answerContent = (
    <div className="space-y-4">
      <div className="space-y-4">
        <BotMessage content={data || ''} />
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopyToClipboard}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );

  const titleContent = (
    <div className="flex items-center gap-2.5 px-1">
      <Sparkles className="h-5 w-5 text-primary" />
      <span className="text-lg font-semibold bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-200 dark:to-white bg-clip-text text-transparent">
        Answer
      </span>
    </div>
  );

  return hasHeader ? (
    <Section title={titleContent}>{answerContent}</Section>
  ) : (
    <div className="space-y-2">
      <div className="mb-1">{titleContent}</div>
      {answerContent}
    </div>
  );
}