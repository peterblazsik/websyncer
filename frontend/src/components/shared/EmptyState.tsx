import React from "react";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-brand-border flex items-center justify-center mb-5">
        {icon || <Sparkles className="w-7 h-7 text-brand-muted" />}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-brand-muted max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary flex items-center gap-2"
        >
          <Sparkles size={16} />
          {action.label}
        </button>
      )}
    </div>
  );
};
