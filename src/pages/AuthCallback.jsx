import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const [status, setStatus] = useState('Verifying credentials...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // 1. Extract tokens from URL hash (Supabase default)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          // 2. Set the session in Supabase
          setStatus('Authenticating...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Auth error:', error);
            setStatus('Authentication failed. Please try again.');
            return;
          }

          // 3. Attempt mobile app redirect
          setStatus('Opening App...');
          const deepLink = `com.trakkit.daraja://auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;      
          window.location.href = deepLink;

          // 4. Fallback to web dashboard if app doesn't open
          setTimeout(() => {
            setStatus('Redirecting to dashboard...');
            navigate('/dashboard');
          }, 3000);
        } catch (err) {
          console.error('Unexpected error:', err);
          setStatus('Something went wrong. Please try again.');
        }
      } else {
        setStatus('Invalid login link.');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <div style={{ 
        width: '40px', height: '40px', border: '4px solid #f3f3f3', 
        borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' 
      }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <p style={{ marginTop: '20px' }}>{status}</p>
      
      {/* Manual Button in case automatic redirect fails */}
      <button 
  onClick={() => {
    // Re-attempt the redirect using the deep link we already constructed
    if (accessToken && refreshToken) {
       const link = `com.trakkit.daraja://auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
       window.location.href = link;
    } else {
       window.location.reload(); // Fallback if state is lost
    }
  }} 
  style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
>
  Open App Again
</button>
    </div>
  );
}