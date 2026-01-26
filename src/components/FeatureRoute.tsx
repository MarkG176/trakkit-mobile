import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkspace } from '@/hooks/useWorkspace';
import { PageFeatures } from '@/config/projectTypes';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatureRouteProps {
  feature: keyof PageFeatures;
  children: ReactNode;
  fallbackPath?: string;
}

export const FeatureRoute = ({ 
  feature, 
  children, 
  fallbackPath = '/agent' 
}: FeatureRouteProps) => {
  const { features, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-full max-w-md p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  const isFeatureEnabled = features.pages[feature];

  if (!isFeatureEnabled) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
