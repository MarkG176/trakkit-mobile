import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('display_name, first_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to email or metadata
          setDisplayName(
            user.user_metadata?.full_name?.split(' ')[0] || 
            user.email?.split('@')[0] || 
            'User'
          );
        } else {
          // Use display_name or first_name, fallback to email
          setDisplayName(
            data?.display_name || 
            data?.first_name || 
            user.user_metadata?.full_name?.split(' ')[0] || 
            user.email?.split('@')[0] || 
            'User'
          );
        }
      } catch (error) {
        console.error('Error:', error);
        setDisplayName(user.email?.split('@')[0] || 'User');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  return { displayName, loading };
};
