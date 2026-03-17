import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing login...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        navigate('/login?error=invalid_link', { replace: true });
        return;
      }

      // Set the session for web browser login
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        navigate('/login?error=auth_failed', { replace: true });
        return;
      }

      // Validate that the user's email exists in user_roles
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: emailExists } = await supabase
          .rpc('check_email_exists', { p_email: user.email });

        if (!emailExists) {
          await supabase.auth.signOut();
          navigate('/login?error=account_not_found', { replace: true });
          return;
        }
      }

      // Redirect to home page
      navigate('/', { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen flex-col font-sans">
      <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p className="mt-5 text-foreground">{status}</p>
    </div>
  );
}
