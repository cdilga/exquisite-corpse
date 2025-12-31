/**
 * Welcome to Cloudflare Workers!
 * 
 * This is a template for a Cloudflare Worker.
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Route handling
    if (url.pathname === '/') {
      return handleHome(request);
    } else if (url.pathname === '/api/hello') {
      return handleApiHello(request);
    } else if (url.pathname.startsWith('/api/')) {
      return handleApi(request, url.pathname);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

async function handleHome(request) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cloudflare Worker</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333;
            margin-bottom: 1rem;
          }
          .status {
            background: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            display: inline-block;
            margin-bottom: 1rem;
          }
          code {
            background: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
          }
          .endpoints {
            margin-top: 2rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 0.5rem;
          }
          .endpoints h2 {
            margin-top: 0;
            color: #4b5563;
          }
          .endpoints ul {
            list-style: none;
            padding: 0;
          }
          .endpoints li {
            margin: 0.5rem 0;
          }
          .endpoints a {
            color: #6366f1;
            text-decoration: none;
          }
          .endpoints a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Cloudflare Worker</h1>
          <div class="status">✅ Running</div>
          <p>Your Cloudflare Worker is up and running!</p>
          
          <div class="endpoints">
            <h2>Available Endpoints:</h2>
            <ul>
              <li>GET <a href="/">/</a> - This page</li>
              <li>GET <a href="/api/hello">/api/hello</a> - Hello World API</li>
              <li>POST /api/echo - Echoes back your request body</li>
            </ul>
          </div>
          
          <p style="margin-top: 2rem; color: #6b7280;">
            Created with 🤖 Claude and deployed on Cloudflare Workers
          </p>
        </div>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}

async function handleApiHello(request) {
  return new Response(JSON.stringify({
    message: 'Hello from Cloudflare Worker!',
    timestamp: new Date().toISOString(),
    method: request.method,
  }), {
    headers: {
      'content-type': 'application/json',
    },
  });
}

async function handleApi(request, pathname) {
  if (pathname === '/api/echo' && request.method === 'POST') {
    try {
      const body = await request.json();
      return new Response(JSON.stringify({
        echo: body,
        timestamp: new Date().toISOString(),
      }), {
        headers: {
          'content-type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
  }
  
  return new Response(JSON.stringify({
    error: 'Endpoint not found',
    path: pathname
  }), {
    status: 404,
    headers: {
      'content-type': 'application/json',
    },
  });
}