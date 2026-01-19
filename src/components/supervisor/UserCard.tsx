import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { User, Mail } from "lucide-react";

interface UserCardProps {
  displayName: string | null;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  isActive: boolean;
}

export const UserCard = ({ displayName, email, role, isActive }: UserCardProps) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary text-primary-foreground">Admin</Badge>;
      case 'member':
        return <Badge variant="secondary">Member</Badge>;
      case 'viewer':
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-foreground truncate">
              {displayName || 'No name'}
            </h3>
            {getRoleBadge(role)}
          </div>
          
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          
          {!isActive && (
            <Badge variant="outline" className="mt-2 text-xs text-orange-500 border-orange-500/30">
              Inactive
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
