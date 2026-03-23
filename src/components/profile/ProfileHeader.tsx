import { HelpFAQDialog } from "@/components/profile/HelpFAQDialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  displayName: string;
  currentRank: string;
  totalPoints: number;
  teamType?: string;
}

export const ProfileHeader = ({ displayName, teamType }: ProfileHeaderProps) => {
  const { language, setLanguage } = useLanguage();
  const today = new Date();
  const formattedDate = today.toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const teamLabel = teamType
    ? teamType.charAt(0).toUpperCase() + teamType.slice(1).toLowerCase()
    : null;

  // @ts-ignore - __APP_VERSION__ is defined by Vite at build time
  const appVersion = (typeof __APP_VERSION__ !== 'undefined') ? __APP_VERSION__ : 'dev';

  return (
    <div className="bg-primary text-primary-foreground px-6 py-4 flex items-start justify-between relative">
      <div>
        <h1 className="text-xl font-bold">{displayName}</h1>
        <p className="text-sm text-primary-foreground/80 mt-0.5">{formattedDate}</p>
        {teamLabel && (
          <Badge className="mt-1.5 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 text-xs">
            {teamLabel} Team
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
          title={language === 'en' ? 'Badilisha kwa Kiswahili' : 'Switch to English'}
        >
          <Globe className="w-5 h-5" />
        </Button>
        <HelpFAQDialog teamType={teamType} variant="icon" />
      </div>
      <span className="absolute bottom-1 right-2 text-[10px] text-primary-foreground/40">
        v{appVersion} · {language === 'en' ? 'EN' : 'SW'}
      </span>
    </div>
  );
};
