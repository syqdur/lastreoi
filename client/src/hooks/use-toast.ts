import { useState } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

const toasts: Toast[] = []
let toastCount = 0

export function useToast() {
  const [, forceRender] = useState({})

  const toast = ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
    const id = (++toastCount).toString()
    const newToast: Toast = { id, title, description, variant }
    
    toasts.push(newToast)
    forceRender({})
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.splice(index, 1)
        forceRender({})
      }
    }, 5000)
    
    return {
      id,
      dismiss: () => {
        const index = toasts.findIndex(t => t.id === id)
        if (index > -1) {
          toasts.splice(index, 1)
          forceRender({})
        }
      }
    }
  }

  return {
    toast,
    toasts: [...toasts]
  }
}