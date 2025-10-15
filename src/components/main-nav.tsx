
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, BarChart3, Settings, PieChart, CalendarDays, BarChartHorizontal, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Today', icon: Layers },
  { href: '/log', label: 'Log', icon: BarChart3 },
  { href: '/dashboard', label: 'Dashboard', icon: PieChart },
  { href: '/report', label: 'Report', icon: FileText },
  { href: '/analysis', label: 'Analysis', icon: BarChartHorizontal },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background">
      <div className="grid h-full max-w-lg grid-cols-7 mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = (pathname === '/' && href === '/') || (pathname.startsWith(href) && href !== '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-2 rounded-lg hover:bg-muted/50 group',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium text-center">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
