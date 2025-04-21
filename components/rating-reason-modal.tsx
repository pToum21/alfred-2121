import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RatingReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const reasons = [
  'Invalid data',
  'Bad sources',
  'Biased response',
  // Add more reasons as needed
];

export function RatingReasonModal({ isOpen, onClose, onSubmit }: RatingReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('');

  const handleReasonChange = (reason: string) => {
    setSelectedReason(reason);
  };

  const handleSubmit = () => {
    onSubmit(selectedReason);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a reason</DialogTitle>
          <DialogDescription>
            Please choose the reason for your negative rating.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <RadioGroup value={selectedReason} onValueChange={handleReasonChange}>
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <label htmlFor={reason} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {reason}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!selectedReason}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}