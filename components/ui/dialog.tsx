import * as React from "react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ children }) => {
  return <>{children}</>
}

const DialogTrigger: React.FC<{ children?: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => {
  return <div onClick={onClick}>{children}</div>
}

interface DialogContentProps {
  className?: string
  children?: React.ReactNode
  onClose?: () => void
}

const DialogContent: React.FC<DialogContentProps> = ({ className = '', children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
)

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  ...props
}) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
)

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  ...props
}) => (
  <p
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  />
)

const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
)

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
