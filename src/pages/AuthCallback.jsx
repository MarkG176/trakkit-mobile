import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom

export default function AuthCallback() {
  const [status, setStatus] = useState('Verifying credentials...');
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Extract tokens from URL hash (Supabase default)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && refreshToken) {
      setStatus('Opening App...');
      
      // 2. Construct the Deep Link
      // Scheme: matches your Android package or custom scheme
      const deepLink = `com.trakkit.daraja://auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
      
      // 3. Force redirect to the App
      window.location.href = deepLink;

      // 4. Fallback (Optional): If app is not installed, show a message or redirect to web dashboard
      setTimeout(() => {
        setStatus('App not found. Redirecting to web dashboard...');
        // navigate('/dashboard'); // Uncomment to keep them on web if app fails
      }, 3000);
    } else {
      setStatus('Invalid login link.');
    }
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
        onClick={() => window.location.reload()} 
        style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
      >
        Retry
      </button>
    </div>
  );
}