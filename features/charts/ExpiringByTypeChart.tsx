'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';

interface Props {
  data: { iqama: number; license: number; health: number; contract: number; registration: number };
}

export function ExpiringByTypeChart({ data }: Props) {
  const rows = [
    { name: 'الإقامات',         value: data.iqama,        color: '#2563EB' },
    { name: 'التراخيص',         value: data.license,      color: '#F59E0B' },
    { name: 'الشهادات الصحية', value: data.health,       color: '#16A34A' },
    { name: 'العقود',          value: data.contract,     color: '#8B5CF6' },
    { name: 'السجلات',         value: data.registration, color: '#EC4899' },
  ];

  return (
    <Card>
      <CardBody>
        <CardTitle>وثائق قاربت على الانتهاء</CardTitle>
        <CardSub>عدد الوثائق التي تنتهي خلال ٣٠ يوماً، حسب النوع</CardSub>
        <div className="mt-4 h-56">
          <ResponsiveContainer>
            <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: '#334155', fontSize: 13, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{
                  fontFamily: 'inherit',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                }}
                formatter={(v) => [String(v ?? '—'), '']}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 4, 4]}
                isAnimationActive
                animationDuration={650}
                animationEasing="ease-out"
              >
                {rows.map((row, i) => (
                  <Cell key={i} fill={row.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="left"
                  style={{ fontSize: 12, fontWeight: 700, fill: '#0F172A' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

