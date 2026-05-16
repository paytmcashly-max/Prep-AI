import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href: string
  cta: string
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
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "relative col-span-3 grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-xl",
      // light styles
      "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      // dark styles
      "dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]",
      className
    )}
    {...props}
  >
    <div className="relative min-h-[12.5rem] overflow-hidden">
      <div className="absolute inset-0">{background}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/70 via-background/28 to-transparent dark:from-background/80 dark:via-background/34" />
    </div>

    <div className="relative z-10 flex flex-col gap-4 border-t border-black/5 bg-background/88 p-5 backdrop-blur-xl dark:border-white/8 dark:bg-background/84">
      <div className="pointer-events-none z-10 flex flex-col gap-2">
        <Icon className="h-10 w-10 text-neutral-700 dark:text-neutral-300" />
        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
          {name}
        </h3>
        <p className="max-w-lg text-sm leading-7 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>

      <div>
        <Button
          variant="link"
          asChild
          size="sm"
          className="pointer-events-auto p-0 text-sm"
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
