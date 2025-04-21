import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}

export function MultiSelect({ options, value, onChange, placeholder }: MultiSelectProps) {
  const handleValueChange = (newValue: string) => {
    if (value.includes(newValue)) {
      onChange(value.filter(v => v !== newValue));
    } else {
      onChange([...value, newValue]);
    }
  };

  return (
    <Select onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => {}}
                className="mr-2"
              />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}