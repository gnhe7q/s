import * as React from "react"

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  return <>{children}</>
}

interface SheetTriggerProps {
  asChild?: boolean
  children?: React.ReactNode
  onClick?: () => void
}

const SheetTrigger: React.FC<SheetTriggerProps> = ({ children, onClick }) => {
  return <div onClick={onClick}>{children}</div>
}

interface SheetContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  children?: React.ReactNode
  onClose?: () => void
}

const SheetContent: React.FC<SheetContentProps> = ({
  side = 'right',
  className = '',
  children,
  onClose
}) => {
  const sideStyles = {
    top: 'inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top',
    bottom: 'inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=open]:slide-in-from-left sm:max-w-sm',
    right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=open]:slide-in-from-right sm:max-w-sm',
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 ${sideStyles[side]} ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}
    {...props}
  />
)

const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  ...props
}) => (
  <h2
    className={`text-lg font-semibold text-foreground ${className}`}
    {...props}
  />
)

const SheetDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  ...props
}) => (
  <p
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  />
)

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
