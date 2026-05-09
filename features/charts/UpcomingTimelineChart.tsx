'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';

interface Props {
  data: Array<{ date: string; count: number }>;
}

export function UpcomingTimelineChart({ data }: Props) {
  // Format dates as "DD/MM" for x-axis
  const chartData = data.map((d) => {
    const dt = new Date(d.date);
    return {
      ...d,
      label: `${dt.getDate()}/${dt.getMonth() + 1}`,
    };
  });

  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>انتهاءات قادمة (٣٠ يوم)</CardTitle>
            <CardSub>توزيع تواريخ الانتهاء خلال الشهر القادم</CardSub>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-ink-900 num leading-none">{total}</div>
            <div className="text-xs text-ink-500 mt-0.5">الإجمالي</div>
          </div>
        </div>

        <div className="mt-4 h-48">
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="upcomingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: 'inherit',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                }}
                labelFormatter={(v) => `يوم ${v}`}
                formatter={(value) => [`${value ?? 0} وثيقة`, '']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#upcomingGradient)"
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
