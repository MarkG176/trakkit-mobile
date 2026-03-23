import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "sw";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Tabs
  "today": { en: "Today", sw: "Leo" },
  "all_time": { en: "All Time", sw: "Jumla Yote" },

  // Section titles
  "activity_attendance": { en: "Activity & Attendance", sw: "Shughuli & Mahudhurio" },
  "tasks": { en: "Tasks", sw: "Kazi" },
  "sales_revenue": { en: "Sales & Revenue", sw: "Mauzo & Mapato" },
  "engagement": { en: "Engagement", sw: "Mawasiliano" },
  "points_rank": { en: "Points & Rank", sw: "Pointi & Cheo" },
  "account": { en: "Account", sw: "Akaunti" },

  // Metric labels
  "store_visits": { en: "Store Visits", sw: "Ziara za Duka" },
  "check_ins": { en: "Check-ins", sw: "Kuingia Kazini" },
  "work_time": { en: "Work Time", sw: "Muda wa Kazi" },
  "stores_added": { en: "Stores Added", sw: "Maduka Yaliyoongezwa" },
  "total_tasks": { en: "Total Tasks", sw: "Kazi Zote" },
  "completed": { en: "Completed", sw: "Zilizokamilika" },
  "pending": { en: "Pending", sw: "Zinazosubiri" },
  "products_sold": { en: "Products Sold", sw: "Bidhaa Zilizouzwa" },
  "revenue": { en: "Revenue", sw: "Mapato" },
  "sales_made": { en: "Sales Made", sw: "Mauzo Yaliyofanywa" },
  "giveaways": { en: "Giveaways", sw: "Zawadi/Sampuli" },
  "interactions": { en: "Interactions", sw: "Maingiliano" },
  "surveys_done": { en: "Surveys Done", sw: "Utafiti Uliofanywa" },
  "items_given": { en: "Items Given", sw: "Vitu Vilivyotolewa" },
  "notes": { en: "Notes", sw: "Maelezo" },
  "rank": { en: "Rank", sw: "Cheo" },
  "total_points": { en: "Total Points", sw: "Pointi Zote" },

  // Account
  "logout": { en: "Logout", sw: "Toka" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("app_language") as Language) || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
