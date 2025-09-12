'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Today', icon: Layers },
  { href: '/log', label: 'Log', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = (pathname === '/' && href === '/') || (pathname !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 rounded-lg hover:bg-muted/50 group',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
