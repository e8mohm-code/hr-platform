import { Topbar } from '@/components/layout/Topbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: Props) {
  return (
    <>
      <Topbar title={title} />
      <main className="flex-1 p-5 lg:p-6 max-w-[1500px] mx-auto w-full">
        <Card>
          <CardBody className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-warning grid place-items-center mb-4">
              <Construction size={28} />
            </div>
            <h2 className="text-xl font-bold text-ink-900 mb-1">{title}</h2>
            <p className="text-sm text-ink-500 max-w-md mx-auto">{description}</p>
            <p className="text-xs text-ink-400 mt-3">
              هذه الشاشة جزء من المرحلة التالية بعد إعادة البناء بالكامل في Next.js.
            </p>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
