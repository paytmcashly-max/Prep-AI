import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  eyebrow: string
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href: string
  cta: string
  detail: string
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  eyebrow,
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  detail,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[2rem] border border-white/35 bg-white/82 shadow-[0_16px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_20px_60px_rgba(2,6,23,0.4)]",
      // light styles
      "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-24 before:rounded-b-[2rem] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.45),transparent)] before:opacity-90 dark:before:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]",
      className
    )}
    {...props}
  >
    <div className="relative min-h-[13.5rem] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_42%)] px-5 pt-5">
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-full border border-white/40 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-300">
          {eyebrow}
        </span>
        <span className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/78 text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/72 dark:text-slate-100">
          <Icon className="size-4.5" />
        </span>
      </div>

      <div className="absolute inset-0">{background}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/92 via-white/42 to-transparent dark:from-slate-950/92 dark:via-slate-950/38" />
    </div>

    <div className="relative z-10 flex flex-col gap-4 border-t border-black/5 bg-white/86 p-5 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/86">
      <div className="pointer-events-none z-10 flex flex-col gap-2">
        <h3 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-neutral-800 dark:text-neutral-100">
          {name}
        </h3>
        <p className="max-w-lg text-sm leading-7 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full border border-black/6 bg-black/[0.03] px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] text-neutral-600 dark:border-white/8 dark:bg-white/[0.04] dark:text-neutral-300">
          {detail}
        </span>
        <Button
          variant="outline"
          asChild
          size="sm"
          className="pointer-events-auto rounded-full border-white/50 bg-white/75 px-3.5 shadow-sm dark:border-white/10 dark:bg-slate-900/75"
        >
          <a href={href}>
            {cta}
            <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
          </a>
        </Button>
      </div>
    </div>
  </div>
)

export { BentoCard, BentoGrid }
