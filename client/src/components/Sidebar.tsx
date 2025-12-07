// components/Sidebar.tsx
import React from 'react';
import { SuggestionZone } from '../types';

type Props = {
  zones: SuggestionZone[];
  onJumpTo: (zone: SuggestionZone) => void;
};

const ZONE_COLORS: Record<string, string> = {
  repetition: '#FFF59D',     // yellow
  contradiction: '#FFCDD2',  // red
  gap: '#BBDEFB',            // blue
  todo: '#E0E0E0',           // grey
};

export default function Sidebar({ zones, onJumpTo }: Props) {
  return (
    <aside style={{ width: 320, borderLeft: '1px solid #eee', paddingLeft: 12 }}>
      <h3>AI Suggestions</h3>
      {zones.length === 0 && <div>No suggestions</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {zones.map((z) => (
          <li key={z.id} style={{ marginBottom: 12, paddingLeft: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {z.type}
              </div>
              <div style={{ color: '#666' }}>{z.confidence?.toFixed(2)}</div>
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{z.message}</div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => onJumpTo(z)}>Jump to</button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
