'use client'

import { useState, useMemo } from 'react';
import { Combobox as HeadlessCombobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from './utils';
import { Label } from './Label';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  label?: string;
  helperText?: string;
  error?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  portalled?: boolean;
  required?: boolean;
  id?: string;
}

export function Combobox({
  label,
  helperText,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  buttonClassName = '',
  required,
  id,
}: ComboboxProps) {
  const [query, setQuery] = useState('');
  const hasError = Boolean(error);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  return (
    <div className={className}>
      {label && <Label htmlFor={id} required={required} className="mb-2">{label}</Label>}
      <HeadlessCombobox
        value={selectedOption}
        onChange={(option) => onChange(option?.value ?? '')}
        disabled={disabled}
      >
        <div className="relative">
          <div
            className={cn(
              'relative w-full cursor-default overflow-hidden rounded-md border bg-background text-left text-sm',
              hasError ? 'border-destructive/50 focus-within:ring-2 focus-within:ring-destructive/20' : 'border-border hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
              buttonClassName
            )}
          >
            <ComboboxInput
              id={id}
              className={cn(
                'w-full border-none py-2.5 pl-3 pr-10 text-sm bg-transparent outline-none',
                selectedOption ? 'text-foreground' : 'text-muted-foreground'
              )}
              displayValue={(option: ComboboxOption | null) => option?.label ?? ''}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </ComboboxButton>
          </div>
          <ComboboxOptions
            className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-background py-1 shadow-lg focus:outline-none"
          >
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches found.</div>
            ) : (
              filteredOptions.map((option) => (
                <ComboboxOption
                  key={option.value}
                  value={option}
                  className={({ active, selected }) =>
                    cn(
                      'relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm',
                      active && 'bg-muted',
                      selected && 'text-foreground'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </HeadlessCombobox>
      {error && (
        <p className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
