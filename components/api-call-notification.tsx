import React from 'react';
import { Card } from './ui/card';

interface APICallNotificationProps {
  description: string;
  response?: any;
}

export function APICallNotification({ description, response }: APICallNotificationProps) {
  return (
    <Card className="p-4 mt-2 bg-blue-50 border-blue-200">
      <p className="text-sm text-blue-700">{description}</p>
      {response && (
        <pre className="mt-2 text-xs bg-blue-100 p-2 rounded">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </Card>
  );
}