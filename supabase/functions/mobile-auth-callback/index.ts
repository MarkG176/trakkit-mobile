import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Logging in to Trakkit...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --primary: #0a7ea4;
      --bg: #ffffff;
      --text: #11181C;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --primary: #ffffff;
        --bg: #151718;
        --text: #ECEDEE;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      background-color: var(--bg);
      color: var(--text);
      text-align: center;
    }
    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid var(--text);
      border-top: 4px solid var(--primary);
      border-radius: 50%;
      opacity: 0.5;
      animation: spin 1s linear infinite;
      margin-bottom: 24px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px 0; }
    p { font-size: 16px; line-height: 1.5; opacity: 0.8; margin: 0 0 24px 0; max-width: 320px; }
    .button {
      display: inline-block;
      background-color: var(--primary);
      color: var(--bg); /* Contrast text */
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 16px;
      font-weight: 600;
      font-size: 16px;
      transition: opacity 0.2s;
    }
    .button:active { opacity: 0.8; }
    .hidden { display: none !important; }
    #manual { animation: fadein 0.5s ease; }
    @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
  </style>
</head>
<body>
  <div id="status">
    <div class="loader"></div>
    <h1>Opening Trakkit...</h1>
    <p>Please wait while we redirect you to the app.</p>
  </div>

  <div id="manual" class="hidden">
    <h1>Open Trakkit</h1>
    <p>If the app didn't open automatically, click the button below.</p>
    <a id="open-app-btn" href="#" class="button">Open App</a>
    
    <div style="margin-top: 40px; opacity: 0.6;">
      <p style="font-size: 14px;">Don't have Trakkit installed?</p>
      <p style="font-size: 14px;">Please install the app to continue.</p>
    </div>
  </div>

  <script>
    // Configuration
    const SCHEME = 'trakkit://';
    const PATH = 'auth/callback';

    function getTokens() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      // Also check search params (query string) just in case
      if (!accessToken) {
        const search = window.location.search.substring(1);
        const searchParams = new URLSearchParams(search);
        return {
            accessToken: searchParams.get('access_token'),
            refreshToken: searchParams.get('refresh_token')
        };
      }
      
      return { accessToken, refreshToken };
    }

    function handleAuth() {
      const { accessToken, refreshToken } = getTokens();

      if (accessToken && refreshToken) {
        const deepLink = \`\${SCHEME}\${PATH}?access_token=\${encodeURIComponent(accessToken)}&refresh_token=\${encodeURIComponent(refreshToken)}\`;
        
        // Try to redirect immediately
        window.location.href = deepLink;
        
        // Show manual button after a short delay in case redirect failed or user is on desktop
        setTimeout(() => {
          document.getElementById('status').classList.add('hidden');
          document.getElementById('manual').classList.remove('hidden');
          document.getElementById('open-app-btn').href = deepLink;
        }, 1500);
      } else {
        // If accessed without hash (e.g. direct visit), just show this.
        // Supabase Auth redirects with #hash, so this script runs client-side.
        document.getElementById('status').innerHTML = '<h1>Link Invalid</h1><p>The login link is invalid or expired.</p>';
      }
    }

    handleAuth();
  </script>
</body>
</html>
`;

serve(async (req) => {
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
});

