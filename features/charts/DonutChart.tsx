'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';

interface Props {
  data: { valid: number; expiring: number; expired: number };
}

export function DonutChart({ data }: Props) {
  const total = data.valid + data.expiring + data.expired;
  const chartData = [
    { name: 'سليمة',  value: data.valid,    color: '#16A34A' },
    { name: 'قريبة',  value: data.expiring, color: '#F59E0B' },
    { name: 'منتهية', value: data.expired,  color: '#DC2626' },
  ];

  return (
    <Card>
      <CardBody>
        <CardTitle>حالة الوثائق</CardTitle>
        <CardSub>توزيع كل الوثائق المتابَعة</CardSub>
        <div className="mt-4 flex items-center gap-6">
          <div className="relative w-40 h-40 shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive
                  animationDuration={600}
                  animationEasing="ease-out"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontFamily: 'inherit',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                  formatter={(value) => [String(value ?? '—'), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-extrabold text-ink-900 num">{total}</div>
              <div className="text-xs text-ink-500">الإجمالي</div>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: entry.color }} />
                  <span className="text-ink-700">{entry.name}</span>
                </div>
                <span className="font-bold text-ink-900 num">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
