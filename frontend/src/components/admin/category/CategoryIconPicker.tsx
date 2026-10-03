'use client';

import { categoryIconOptions } from '@/components/category/CategoryIcon';

export default function CategoryIconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">Icon</legend>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {Object.entries(categoryIconOptions).map(([name, Icon]) => (
          <button key={name} type="button" aria-label={name} aria-pressed={value === name} onClick={() => onChange(name)} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-2 text-xs transition-colors ${value === name ? 'border-primary-500 bg-orange-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" /><span className="truncate">{name}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}