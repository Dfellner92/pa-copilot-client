import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring dark:bg-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    />
  )
}