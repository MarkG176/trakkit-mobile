interface ProfileHeaderProps {
  displayName: string;
  currentRank: string;
  totalPoints: number;
}

export const ProfileHeader = ({ displayName }: ProfileHeaderProps) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-primary text-primary-foreground px-6 py-4">
      <h1 className="text-xl font-bold">{displayName}</h1>
      <p className="text-sm text-primary-foreground/80 mt-0.5">{formattedDate}</p>
    </div>
  );
};
