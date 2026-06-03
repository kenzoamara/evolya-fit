"use client"

import React, { useEffect, useRef } from "react"
import { motion, useInView, useAnimation, useSpring } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const MotionCard = motion(Card)

type ChartDataItem = {
  name: string
  value: number // 0-100 percentage height
  color?: string
}

export interface StatsCardProps {
  title: string
  currentValue: number
  valuePrefix?: string
  valuePostfix?: string
  description: React.ReactNode
  chartData: ChartDataItem[]
  onActionClick?: () => void
  className?: string
  defaultBarColor?: string
  highlightedBarColor?: string
}

const AnimatedValue = ({
  value,
  prefix = "",
  postfix = "",
}: {
  value: number
  prefix?: string
  postfix?: string
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const spring = useSpring(0, { damping: 30, stiffness: 100, mass: 1 })

  useEffect(() => {
    if (isInView) spring.set(value)
  }, [spring, isInView, value])

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Intl.NumberFormat("fr-FR").format(
          Number(latest.toFixed(0))
        )}${postfix}`
      }
    })
    return () => unsubscribe()
  }, [prefix, postfix, spring])

  return <span ref={ref} />
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      currentValue,
      valuePrefix,
      valuePostfix,
      description,
      chartData,
      onActionClick,
      className,
      defaultBarColor = "bg-[#eef6f1]",
      highlightedBarColor = "bg-[#4E9B6F]",
    },
    ref
  ) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(cardRef, { once: true, amount: 0.4 })
    const controls = useAnimation()

    const barVariants = {
      hidden: { scaleY: 0 },
      visible: {
        scaleY: 1,
        transition: { type: "spring" as const, damping: 15, stiffness: 100 },
      },
    }

    useEffect(() => {
      if (isInView) controls.start("visible")
    }, [isInView, controls])

    const HeaderElement = onActionClick ? "button" : "div"

    return (
      <MotionCard
        ref={ref}
        className={cn("w-full overflow-hidden border-[#E2E8F0]", className)}
        whileHover={{ scale: 1.02, y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <HeaderElement
            onClick={onActionClick}
            className={cn(
              "flex w-full items-center justify-between text-left",
              onActionClick &&
                "group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4E9B6F] focus-visible:ring-offset-2"
            )}
            aria-label={onActionClick ? `${title}, voir plus` : undefined}
          >
            <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">
              {title}
            </h3>
            {onActionClick && (
              <ChevronRight className="h-4 w-4 text-[#94A3B8] transition-transform group-hover:translate-x-1" />
            )}
          </HeaderElement>
        </CardHeader>
        <CardContent>
          <div ref={cardRef} className="flex flex-col gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0D1F3C]">
                <AnimatedValue
                  value={currentValue}
                  prefix={valuePrefix}
                  postfix={valuePostfix}
                />
              </h2>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">{description}</p>
            </div>

            <motion.div
              className="flex h-20 w-full items-end gap-2"
              initial="hidden"
              animate={controls}
              transition={{ staggerChildren: 0.07 }}
            >
              {chartData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <motion.div
                    className={cn(
                      "w-full rounded-t-md origin-bottom",
                      item.color
                        ? item.color
                        : index === chartData.length - 1
                        ? highlightedBarColor
                        : defaultBarColor
                    )}
                    variants={barVariants}
                    style={{ height: `${Math.max(item.value, 4)}%` }}
                  />
                  <span className="text-[9px] font-medium text-[#CBD5E1] truncate w-full text-center">
                    {item.name}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </CardContent>
      </MotionCard>
    )
  }
)

StatsCard.displayName = "StatsCard"
