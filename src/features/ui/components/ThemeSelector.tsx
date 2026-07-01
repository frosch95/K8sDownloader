/**
 * ThemeSelector Component
 * 
 * A dropdown component for selecting themes (light, dark, darcula, system).
 * Replaces the ThemeToggle button for direct theme selection.
 */

import { Select } from './Select';

interface ThemeSelectorProps {
  theme: "dark" | "light" | "darcula" | "system";
  onChange: (theme: "dark" | "light" | "darcula" | "system") => void;
}

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "darcula", label: "Darcula" },
    { value: "system", label: "System" },
  ];

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = e.target.value as "dark" | "light" | "darcula" | "system";
    onChange(selectedTheme);
  };

  return (
    <div className="w-32">
      <Select
        size="sm"
        value={theme}
        options={themeOptions}
        onChange={handleThemeChange}
        className="w-full"
      />
    </div>
  );
}
