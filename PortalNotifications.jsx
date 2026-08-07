// PortalNotifications.jsx
// Drop this file into your BOS-CRM src/components/ folder
// Then import and add <PortalNotifications /> to your main navbar/header component
//
// It shows:
//   - An unread message count badge that updates every 60 seconds
//   - A link to portal-admin.html
//   - A count of new Intake-stage supplements (submitted via portal today)
//
// Requires: @supabase/supabase-js already installed (it is — you use it in BOS-CRM)
// Just pass your supabase client instance as a prop, or import it from your existing supabase.js

import { useState, useEffect } from 'react';

// Option A: pass supabase as a prop: <PortalNotifications supabase={supabase} />
// Option B: import your existing client here:
// import { supabase } from '../lib/supabase'; // adjust path to your supabase client file

export default function PortalNotifications({ supabase }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newIntakes, setNewIntakes] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchCounts() {
    try {
      // Unread contractor messages
      const { data: msgs } = await supabase
        .from('portal_messages')
        .select('id', { count: 'exact' })
        .eq('sender', 'contractor')
        .eq('is_read', false);

      // New intakes from today (submitted via portal)
      const today = new Date().toISOString().slice(0, 10);
      const { data: intakes } = await supabase
        .from('supplements')
        .select('id', { count: 'exact' })
        .eq('stage', 'Intake')
        .gte('intake_date', today);

      setUnreadMessages(msgs?.length || 0);
      setNewIntakes(intakes?.length || 0);
    } catch (e) {
      console.error('Portal notification fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const hasActivity = unreadMessages > 0 || newIntakes > 0;

  return (
    <a
      href="/portal-admin.html"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        background: hasActivity ? '#B08D2E' : 'rgba(255,255,255,0.12)',
        color: '#fff',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: '600',
        position: 'relative',
      }}
    >
      {/* Portal icon */}
      <span>🔗</span>
      <span>Contractor Portal</span>

      {/* Unread messages badge */}
      {unreadMessages > 0 && (
        <span style={{
          background: '#fff',
          color: '#B08D2E',
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 7px',
          borderRadius: '20px',
          lineHeight: '1.4',
        }}>
          {unreadMessages} msg{unreadMessages !== 1 ? 's' : ''}
        </span>
      )}

      {/* New intake badge */}
      {newIntakes > 0 && (
        <span style={{
          background: '#1F3A5F',
          color: '#fff',
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 7px',
          borderRadius: '20px',
          lineHeight: '1.4',
        }}>
          {newIntakes} new
        </span>
      )}
    </a>
  );
}

// ── USAGE IN YOUR NAVBAR ──
// 1. Copy this file to src/components/PortalNotifications.jsx
// 2. In your navbar/header component, import it:
//      import PortalNotifications from './PortalNotifications';
// 3. Add it next to your other nav items:
//      <PortalNotifications supabase={supabase} />
// 4. Add portal-admin.html to your Netlify deploy folder (same level as index.html)
//
// That's it — no other changes needed to the CRM.
