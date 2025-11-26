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
      const deepLink = `trakkit://auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
      window.location.href = deepLink;

      // Update status after a delay
      setTimeout(() => {
        setStatus('If the app didn\'t open, click the button below.');
      }, 2000);
    } else {
      setStatus('Invalid login link.');
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      flexDirection: 'column', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        width: '40px', height: '40px', border: '4px solid #f3f3f3', 
        borderTop: '4px solid #0a7ea4', borderRadius: '50%', animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      
      <h1 style={{ fontSize: '24px', margin: '0 0 12px 0' }}>Opening Trakkit...</h1>
      <p style={{ fontSize: '16px', color: '#666', maxWidth: '320px', margin: '0 0 24px 0' }}>{status}</p>
      
      {/* Manual Button in case automatic redirect fails */}
      {tokens && (
        <>
          <button 
            onClick={() => {
              const link = `trakkit://auth/callback?access_token=${encodeURIComponent(tokens.accessToken)}&refresh_token=${encodeURIComponent(tokens.refreshToken)}`;
              window.location.href = link;
            }} 
            style={{ 
              marginTop: '10px', 
              padding: '12px 24px', 
              backgroundColor: '#0a7ea4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Open App Again
          </button>
          
          <div style={{ marginTop: '40px', opacity: 0.6 }}>
            <p style={{ fontSize: '14px', margin: '5px 0' }}>Don't have Trakkit installed?</p>
            <p style={{ fontSize: '14px', margin: '5px 0' }}>Please install the app to continue.</p>
          </div>
        </>
      )}
    </div>
  );
}
