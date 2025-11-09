"use client"

import { useEffect, useRef, useState } from "react"

const Reveal = ({
  as: Component = "div",
  children,
  className = "",
  delay = 0,
  triggerOnce = true,
  initialClassName = "opacity-0 translate-y-8",
  animatedClassName = "animate-slide-up",
  style = {},
}) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (triggerOnce && node) {
              observer.unobserve(node)
            }
          } else if (!triggerOnce) {
            setIsVisible(false)
          }
        })
      },
      {
        threshold: 0.2,
      },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [triggerOnce])

  const combinedClassName = [
    className,
    "transition-all duration-700 ease-out will-change-transform",
    isVisible ? animatedClassName : initialClassName,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <Component
      ref={ref}
      className={combinedClassName}
      style={{
        ...style,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Component>
  )
}

export default Reveal

