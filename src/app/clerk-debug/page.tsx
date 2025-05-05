'use client';
import { useUser } from '@clerk/nextjs';

export default function ClerkDebug() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Clerk Debug</h1>
      <pre style={{ background: '#f3f3f3', padding: 16, borderRadius: 8 }}>
        {JSON.stringify({ isLoaded, isSignedIn, user }, null, 2)}
      </pre>
      <p style={{ marginTop: 24, color: '#555' }}>
        <b>Instructions:</b><br />
        - <b>isLoaded</b> should become <code>true</code> after a moment.<br />
        - If <b>isLoaded</b> is <code>false</code> forever, Clerk is not initializing.<br />
        - If <b>isLoaded</b> is <code>true</code> and <b>isSignedIn</b> is <code>false</code>, you are not signed in.<br />
        - If <b>isLoaded</b> is <code>true</code> and <b>isSignedIn</b> is <code>true</code>, you are signed in.<br />
      </p>
    </div>
  );
} 