import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-black text-white border border-black hover:bg-gray-900 dark:hover:bg-gray-100 dark:hover:text-black',
  secondary:
    'bg-white text-black border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:hover:bg-gray-800',
  danger:
    'bg-red-600 text-white border border-red-600 hover:bg-red-700 dark:hover:bg-red-500',
  ghost:
    'bg-transparent text-black border border-transparent hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800',
}

export function Button({
  className,
  variant = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
