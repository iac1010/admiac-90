
import React, { useState, useCallback } from 'react';
import Input from './Input';

interface SearchBarProps<T> {
  items: T[];
  searchKeys: (keyof T)[];
  onSearch: (results: T[]) => void;
  placeholder?: string;
  label?: string;
}

const SearchBar = <T,>({ items, searchKeys, onSearch, placeholder = "Search...", label }: SearchBarProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    if (term === '') {
      onSearch(items);
      return;
    }
    const filteredItems = items.filter(item => 
      searchKeys.some(key => {
        const value = item[key];
        return typeof value === 'string' && value.toLowerCase().includes(term);
      })
    );
    onSearch(filteredItems);
  }, [items, searchKeys, onSearch]);

  return (
    <Input
      label={label}
      type="text"
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleSearch}
      className="mb-0" // Remove default margin from Input
    />
  );
};

export default SearchBar;