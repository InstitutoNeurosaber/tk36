import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings } from 'lucide-react';

interface UserMenuProps {
  userName: string;
  onSignOut: () => void;
}

export function UserMenu({ userName, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
      >
        <User className="h-5 w-5" />
        <span className="text-sm font-medium">{userName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
              <p className="font-medium text-foreground">{userName}</p>
            </div>
            <button
              onClick={onSignOut}
              className="w-full flex items-center px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}