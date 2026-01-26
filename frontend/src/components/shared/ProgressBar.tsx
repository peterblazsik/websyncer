interface ProgressBarProps {
    current: number;
    total: number;
    logs: string[];
    status?: string;
}

export function ProgressBar({ current, total, logs, status = 'Processing...' }: ProgressBarProps) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="mt-6 space-y-4">
            {/* Progress Header */}
            <div className="flex items-center justify-between">
                <span className="text-white text-sm font-bold uppercase tracking-wide">{status}</span>
                <span className="text-white text-sm font-bold">{percent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>

            {/* Log Area */}
            {logs.length > 0 && (
                <div className="log-area">
                    {logs.map((entry, i) => (
                        <div key={i} className="log-entry">
                            {entry}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
