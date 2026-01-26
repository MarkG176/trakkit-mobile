import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { User, Mail, ChevronRight } from "lucide-react";
import { UserDetailSheet } from "./UserDetailSheet";

interface UserCardProps {
  userId: string;
  displayName: string | null;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  isActive: boolean;
}

export const UserCard = ({ userId, displayName, email, role, isActive }: UserCardProps) => {
  const [detailOpen, setDetailOpen] = useState(false);

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
    <>
      <Card 
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
        onClick={() => setDetailOpen(true)}
      >
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

          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center" />
        </div>
      </Card>

      <UserDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        userId={userId}
        displayName={displayName}
        email={email}
        role={role}
      />
    </>
  );
};
