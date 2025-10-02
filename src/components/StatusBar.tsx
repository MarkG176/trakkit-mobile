import { Clock, CheckCircle, XCircle, Coffee } from 'lucide-react';
import { AgentStatus } from '@/hooks/useAgentStatus';
import { Badge } from './ui/badge';

interface StatusBarProps {
  status: AgentStatus;
  loading: boolean;
}

export const StatusBar = ({ status, loading }: StatusBarProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'checked_in':
        return {
          icon: CheckCircle,
          label: 'Checked In',
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
        };
      case 'lunch':
        return {
          icon: Coffee,
          label: 'On Lunch',
          variant: 'secondary' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600',
        };
      case 'checked_out':
      default:
        return {
          icon: XCircle,
          label: 'Checked Out',
          variant: 'outline' as const,
          className: 'bg-gray-500 hover:bg-gray-600',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1">
        <Clock size={16} className="animate-pulse" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className} text-white`}>
      <Icon size={14} />
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  );
};
