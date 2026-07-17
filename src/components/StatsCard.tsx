'use client';

import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: number;
  subtitle?: string;
  tooltip?: ReactNode;
}

export default function StatsCard({ title, value, icon: Icon, color, bgColor, trend, subtitle, tooltip }: StatsCardProps) {
  return (
    <div className="relative glass rounded-2xl p-5 hover:border-violet-500/20 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-text-muted font-medium">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-dim">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(trend)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor} ${color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon size={24} />
        </div>
      </div>
      {tooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 rounded-xl bg-surface border border-border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
          {tooltip}
        </div>
      )}
    </div>
  );
}
