import React from 'react';
import { Stamp, ChevronDown } from 'lucide-react';
import type { WatermarkPosition } from '../../lib/imageProcessing';

interface WatermarkSettingsProps {
    enabled: boolean;
    position: WatermarkPosition;
    onEnabledChange: (enabled: boolean) => void;
    onPositionChange: (position: WatermarkPosition) => void;
}

const POSITION_LABELS: Record<WatermarkPosition, string> = {
    'bottom-right': 'Bottom Right',
    'bottom-left': 'Bottom Left',
    'top-right': 'Top Right',
    'top-left': 'Top Left',
};

export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
    enabled,
    position,
    onEnabledChange,
    onPositionChange,
}) => {
    return (
        <div className="flex items-center gap-4">
            {/* Toggle */}
            <button
                onClick={() => onEnabledChange(!enabled)}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all border
                    ${
                        enabled
                            ? 'bg-brand-orange text-white border-brand-orange'
                            : 'bg-transparent text-brand-muted border-brand-border hover:border-white/50 hover:text-white'
                    }
                `}
            >
                <Stamp size={14} />
                <span>Add Branding</span>
            </button>

            {/* Position Dropdown - only shown when enabled */}
            {enabled && (
                <div className="relative">
                    <select
                        value={position}
                        onChange={(e) => onPositionChange(e.target.value as WatermarkPosition)}
                        className="
                            appearance-none bg-black border border-brand-border rounded-lg
                            px-3 py-1.5 pr-8 text-sm text-white
                            hover:border-white/50 focus:border-white/50 focus:outline-none
                            cursor-pointer
                        "
                    >
                        {Object.entries(POSITION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={14}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none"
                    />
                </div>
            )}
        </div>
    );
};
