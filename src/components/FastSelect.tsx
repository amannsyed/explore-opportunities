import React, { useState, useMemo } from 'react';
import Select, { Props as SelectProps } from 'react-select';

interface FastSelectProps extends Omit<SelectProps, 'options'> {
  options: { value: string; label: string }[];
  maxOptions?: number;
}

export default function FastSelect({ options, maxOptions = 100, ...props }: FastSelectProps) {
  const [inputValue, setInputValue] = useState('');

  const filteredOptions = useMemo(() => {
    if (!inputValue) {
      return options.slice(0, maxOptions);
    }
    const lowerInput = inputValue.toLowerCase();
    return options.filter(option => option.label.toLowerCase().includes(lowerInput)).slice(0, maxOptions);
  }, [options, inputValue, maxOptions]);

  return (
    <Select
      {...props}
      options={filteredOptions}
      onInputChange={(newValue, actionMeta) => {
        if (actionMeta.action === 'input-change') {
          setInputValue(newValue);
        } else if (actionMeta.action === 'menu-close') {
          setInputValue('');
        }
        if (props.onInputChange) {
          props.onInputChange(newValue, actionMeta);
        }
      }}
      filterOption={() => true} // Disable built-in filtering since we do it manually
    />
  );
}
