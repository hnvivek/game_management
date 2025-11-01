'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: Array<{
    id: string
    name: string
    displayName: string
    icon?: string
  }>
  className?: string
}

export default function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.name === value)

  const filteredOptions = options.filter(option =>
    option.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: typeof options[0]) => {
    onValueChange(option.name)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {selectedOption && selectedOption.icon && (
            <span>{selectedOption.icon}</span>
          )}
          <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedOption ? selectedOption.displayName : placeholder}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1.5 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full flex items-center gap-2 p-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                    value === option.name && 'bg-accent text-accent-foreground'
                  )}
                >
                  {option.icon && <span>{option.icon}</span>}
                  <span className="flex-1 text-left">{option.displayName}</span>
                  {value === option.name && (
                    <Check className="h-4 w-4 text-accent-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}