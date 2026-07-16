import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8', className)}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="hsl(var(--primary))" />
      <path
        d="M20 9L29 13V20C29 25.5 25.2 29.7 20 31C14.8 29.7 11 25.5 11 20V13L20 9Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M16.5 19.5L19 22L24 16.5"
        stroke="hsl(var(--primary))"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand({
  className,
  showText = true,
  size = 'default',
}: {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) {
  const text =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const mark = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BrandMark className={mark} />
      {showText && (
        <span className={cn('font-bold tracking-tight text-foreground', text)}>
          Trust<span className="text-primary">Pass</span>
        </span>
      )}
    </div>
  );
}
