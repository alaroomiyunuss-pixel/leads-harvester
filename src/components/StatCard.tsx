import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: number;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    value: 'text-blue-300',
    glow: 'shadow-blue-500/10',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    value: 'text-green-300',
    glow: 'shadow-green-500/10',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-400',
    value: 'text-yellow-300',
    glow: 'shadow-yellow-500/10',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    value: 'text-purple-300',
    glow: 'shadow-purple-500/10',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`rounded-2xl border p-5 ${c.bg} ${c.border} shadow-lg ${c.glow} transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <span className={`text-xs mt-1 inline-block ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.bg} border ${c.border}`}>
          <Icon size={22} className={c.icon} />
        </div>
      </div>
    </div>
  );
}
