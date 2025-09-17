import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-12 h-12 text-primary', className)}
      {...props}
    >
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
      <path d="M12 12a10 10 0 0 0-9.94 9.4" />
    </svg>
  );
}
