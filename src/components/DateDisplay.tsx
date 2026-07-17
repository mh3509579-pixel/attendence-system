'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

export default function DateDisplay() {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      setDateStr(
        new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!dateStr) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-border">
      <CalendarDays size={16} className="text-violet-400 shrink-0" />
      <span className="text-sm text-text-muted whitespace-nowrap">{dateStr}</span>
    </div>
  );
}
