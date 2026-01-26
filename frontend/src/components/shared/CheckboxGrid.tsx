import { Check } from 'lucide-react';

interface CheckboxOption {
    value: string;
    label: string;
    size?: string;
}

interface CheckboxGridProps {
    label: string;
    options: CheckboxOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    columns?: 2 | 3;
}

export function CheckboxGrid({
    label,
    options,
    selected,
    onChange,
    columns = 2,
}: CheckboxGridProps) {
    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const selectAll = () => {
        onChange(options.map((o) => o.value));
    };

    const selectNone = () => {
        onChange([]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="form-label">{label}</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={selectAll}
                        className="text-xs text-brand-muted hover:text-white transition-colors"
                    >
                        Select All
                    </button>
                    <span className="text-brand-border">|</span>
                    <button
                        type="button"
                        onClick={selectNone}
                        className="text-xs text-brand-muted hover:text-white transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div
                className={`grid gap-3 ${
                    columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                }`}
            >
                {options.map((option) => {
                    const isChecked = selected.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleOption(option.value)}
                            className={`checkbox-item ${isChecked ? 'checked' : ''}`}
                        >
                            <div className="checkbox-box">
                                {isChecked && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <span className="text-white font-medium text-sm">{option.label}</span>
                            {option.size && (
                                <span className="text-brand-muted text-xs ml-auto">{option.size}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
