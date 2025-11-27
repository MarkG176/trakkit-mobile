import { useEffect, useState } from 'react';

export default function AuthCallback() {
  const [status, setStatus] = useState('Opening App...');
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    // Extract tokens from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
      
      // Immediately redirect to mobile app (NO setSession - let the app consume the token)
      const deepLink = `com.trakkit.daraja://auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
      window.location.href = deepLink;
    } else {
      setStatus('Invalid login link.');
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <div style={{ 
        width: '40px', height: '40px', border: '4px solid #f3f3f3', 
        borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' 
      }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <p style={{ marginTop: '20px' }}>{status}</p>
      
      {/* Manual Button in case automatic redirect fails */}
      {tokens && (
        <button 
          onClick={() => {
            const link = `com.trakkit.daraja://auth/callback?access_token=${encodeURIComponent(tokens.accessToken)}&refresh_token=${encodeURIComponent(tokens.refreshToken)}`;
            window.location.href = link;
          }} 
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Open App Again
        </button>
      )}
    </div>
  );
}