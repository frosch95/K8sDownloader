/**
 * ThemeSelector Component
 * 
 * A dropdown component for selecting themes (light, dark, darcula, system).
 * Replaces the ThemeToggle button for direct theme selection.
 */

import { CustomSelect } from './CustomSelect';

type ThemeType = "dark" | "light" | "darcula" | "system";

interface ThemeSelectorProps {
  theme: ThemeType;
  onChange: (value: ThemeType) => void;
}

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  const themeOptions: { value: ThemeType; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "darcula", label: "Darcula" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="w-32">
      <CustomSelect
        size="sm"
        value={theme}
        options={themeOptions}
        onChange={onChange}
        className="w-full"
      />
    </div>
  );
}
