import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-2xl bg-surface-light/50 mb-4">
        <Icon size={40} className="text-text-dim" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-muted text-sm text-center max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-medium text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
