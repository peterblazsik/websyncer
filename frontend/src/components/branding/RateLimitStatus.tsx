import React from 'react';
import type { RateLimitStatus } from '../../types/branding';
import { Clock, Calendar, Shield } from 'lucide-react';

interface RateLimitStatusProps {
    status: RateLimitStatus | null;
    loading?: boolean;
}

export const RateLimitStatusDisplay: React.FC<RateLimitStatusProps> = ({ status, loading }) => {
    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-brand-muted">
                <div className="w-4 h-4 border-2 border-brand-muted border-t-transparent rounded-full animate-spin" />
                <span>Loading limits...</span>
            </div>
        );
    }

    if (!status) {
        return null;
    }

    const shortTermRemaining = status.shortTerm.limit - status.shortTerm.used;
    const dailyRemaining = status.daily.limit - status.daily.used;

    const shortTermPercent = (status.shortTerm.used / status.shortTerm.limit) * 100;
    const dailyPercent = (status.daily.used / status.daily.limit) * 100;

    const getStatusColor = (percent: number) => {
        if (percent >= 90) return 'text-red-500';
        if (percent >= 70) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Whitelist Badge */}
            {status.whitelisted && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                    <Shield size={12} />
                    <span>VIP</span>
                </div>
            )}

            {/* Short Term Limit */}
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-brand-muted" />
                <span className="text-brand-muted">10 min:</span>
                <span className={getStatusColor(shortTermPercent)}>
                    {shortTermRemaining} / {status.shortTerm.limit}
                </span>
            </div>

            {/* Daily Limit */}
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-muted" />
                <span className="text-brand-muted">Daily:</span>
                <span className={getStatusColor(dailyPercent)}>
                    {dailyRemaining} / {status.daily.limit}
                </span>
            </div>
        </div>
    );
};
