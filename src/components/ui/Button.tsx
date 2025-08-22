import { cn } from '@/lib/utils'

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-3 py-2 border font-medium hover:bg-gray-100 dark:hover:bg-gray-800',
        className
      )}
      {...props}
    />
  )
}