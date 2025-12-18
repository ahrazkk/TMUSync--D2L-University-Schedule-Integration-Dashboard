import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted/50 relative overflow-hidden", className)}
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-aurora-shimmer"
        style={{
          background: `linear-gradient(
            90deg, 
            transparent 0%, 
            rgba(167, 139, 250, 0.1) 40%, 
            rgba(34, 211, 238, 0.15) 50%, 
            rgba(167, 139, 250, 0.1) 60%, 
            transparent 100%
          )`,
          filter: 'blur(5px)',
        }}
      />
    </div>
  )
}

export { Skeleton }
