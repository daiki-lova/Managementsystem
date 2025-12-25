import React from 'react';
import { TrendingUp, Users, Clock, MousePointerClick } from 'lucide-react';

export function ScoreCard() {
  return (
    <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 text-white shadow-2xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-1">総合品質スコア</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold text-blue-400">85</span>
            <span className="text-xl text-neutral-500">/ 100</span>
          </div>
        </div>
        <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
            上位 15%
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricItem 
          icon={<Users size={16} />}
          label="想定PV数"
          value="12,400"
          trend="+12%"
          positive
        />
        <MetricItem 
          icon={<Clock size={16} />}
          label="読了時間"
          value="3:45"
          trend="-5%"
          positive={false}
        />
        <MetricItem 
          icon={<MousePointerClick size={16} />}
          label="想定CTR"
          value="4.2%"
          trend="+0.8%"
          positive
        />
        <MetricItem 
          icon={<TrendingUp size={16} />}
          label="SEO順位"
          value="8位"
          trend="圏外"
          positive
        />
      </div>
    </div>
  );
}

function MetricItem({ icon, label, value, trend, positive }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  trend: string,
  positive: boolean
}) {
  return (
    <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
      <div className="flex items-center gap-2 text-neutral-400 mb-2 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className={`text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {trend}
      </div>
    </div>
  )
}
