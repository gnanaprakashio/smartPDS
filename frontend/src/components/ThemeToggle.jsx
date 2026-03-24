import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, setThemeMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentIcon = () => {
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Always light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Always dark mode' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system setting' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-surfaceHover transition-all duration-200 shadow-sm"
        aria-label="Toggle theme"
        aria-haspopup="true"
        aria-expanded={showDropdown}
      >
        {getCurrentIcon()}
        <span className="text-sm font-medium text-slate-700 dark:text-dark-text hidden sm:inline">
          {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
        </span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-slate-200 dark:border-dark-border overflow-hidden z-50 animate-slide-down">
          <div className="py-1">
            <p className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-dark-textMuted uppercase tracking-wider bg-slate-50 dark:bg-dark-bgSecondary">
              Select Theme
            </p>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value || 
                (option.value === 'system' && !localStorage.getItem(STORAGE_KEY));
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setThemeMode(option.value);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' 
                      : 'text-slate-700 dark:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-surfaceHover'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-dark-textSecondary'}`} />
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-slate-500 dark:text-dark-textMuted">{option.description}</p>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const STORAGE_KEY = 'ration-system-theme';
