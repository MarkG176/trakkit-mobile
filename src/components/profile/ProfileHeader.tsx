import { HelpFAQDialog } from "@/components/profile/HelpFAQDialog";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  displayName: string;
  currentRank: string;
  totalPoints: number;
  teamType?: string;
}

export const ProfileHeader = ({ displayName, teamType }: ProfileHeaderProps) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const teamLabel = teamType
    ? teamType.charAt(0).toUpperCase() + teamType.slice(1).toLowerCase()
    : null;

  return (
    <div className="bg-primary text-primary-foreground px-6 py-4 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold">{displayName}</h1>
        <p className="text-sm text-primary-foreground/80 mt-0.5">{formattedDate}</p>
        {teamLabel && (
          <Badge className="mt-1.5 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 text-xs">
            {teamLabel} Team
          </Badge>
        )}
      </div>
      <HelpFAQDialog teamType={teamType} variant="icon" />
    </div>
  );
};
