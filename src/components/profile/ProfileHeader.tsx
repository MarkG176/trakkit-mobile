import { HelpFAQDialog } from "@/components/profile/HelpFAQDialog";

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

  return (
    <div className="bg-primary text-primary-foreground px-6 py-4 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold">{displayName}</h1>
        <p className="text-sm text-primary-foreground/80 mt-0.5">{formattedDate}</p>
      </div>
      <HelpFAQDialog teamType={teamType} variant="icon" />
    </div>
  );
};
