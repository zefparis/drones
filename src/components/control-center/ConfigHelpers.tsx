/**
 * Configuration Helper Components
 * Reusable UI elements for module configuration
 */

import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';

interface ConfigSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ConfigSection({ title, description, children }: ConfigSectionProps) {
  return (
    <div className="border-l-2 border-cyan-500/30 pl-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

interface ConfigSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ConfigSwitch({ label, description, checked, onCheckedChange }: ConfigSwitchProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex-1 pr-4">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="w-11 h-6 bg-slate-700 rounded-full relative data-[state=checked]:bg-cyan-500 transition-colors"
      >
        <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </div>
  );
}

interface ConfigSliderProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function ConfigSlider({ label, description, value, min, max, step, unit, onChange }: ConfigSliderProps) {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200">{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
        <div className="text-sm font-mono font-bold text-cyan-400 min-w-[80px] text-right">
          {value}{unit && <span className="text-slate-500 ml-1">{unit}</span>}
        </div>
      </div>
      <Slider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0])}
        className="relative flex items-center select-none touch-none w-full h-5"
      >
        <Slider.Track className="bg-slate-700 relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-grab active:cursor-grabbing" />
      </Slider.Root>
      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface ConfigSelectProps {
  label: string;
  description: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export function ConfigSelect({ label, description, value, options, onChange }: ConfigSelectProps) {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="mb-2">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

interface ConfigInputProps {
  label: string;
  description: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}

export function ConfigInput({ label, description, value, placeholder, type = 'text', onChange }: ConfigInputProps) {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="mb-2">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
      />
    </div>
  );
}

interface ConfigNumberProps {
  label: string;
  description: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function ConfigNumber({ label, description, value, min, max, step = 1, unit, onChange }: ConfigNumberProps) {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="mb-2">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
        />
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

export function ConfigDivider() {
  return <div className="border-t border-slate-700/50 my-4" />;
}

interface ConfigAlertProps {
  type: 'info' | 'warning' | 'error';
  children: React.ReactNode;
}

export function ConfigAlert({ type, children }: ConfigAlertProps) {
  const styles = {
    info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚨',
  };

  return (
    <div className={`border rounded-lg p-3 text-sm flex items-start gap-2 ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}
