"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-black" />,
        info: <InfoIcon className="size-4 text-zinc-500" />,
        warning: <TriangleAlertIcon className="size-4 text-zinc-500" />,
        error: <OctagonXIcon className="size-4 text-red-500" />,
        loading: <Loader2Icon className="size-4 animate-spin text-zinc-500" />,
      }}
      toastOptions={{
        classNames: {
          toast: "bg-white border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[20px] text-zinc-950 font-sans p-4",
          description: "text-zinc-500",
          actionButton: "bg-black text-white rounded-full font-medium px-4 py-2",
          cancelButton: "bg-zinc-100 text-zinc-900 rounded-full font-medium px-4 py-2 hover:bg-zinc-200 transition-colors",
        },
      }}
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "black",
          "--normal-border": "transparent",
          "--success-bg": "white",
          "--success-text": "black",
          "--success-border": "transparent",
          "--error-bg": "white",
          "--error-text": "black",
          "--error-border": "transparent",
          "--warning-bg": "white",
          "--warning-text": "black",
          "--warning-border": "transparent",
          "--info-bg": "white",
          "--info-text": "black",
          "--info-border": "transparent",
          "--border-radius": "20px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
