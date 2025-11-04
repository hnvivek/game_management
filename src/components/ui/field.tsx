import * as React from "react"

import { cn } from "@/lib/utils"

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  )
)
Field.displayName = "Field"

interface FieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
)
FieldGroup.displayName = "FieldGroup"

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string
}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
)
FieldLabel.displayName = "FieldLabel"

interface FieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const FieldDescription = React.forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
)
FieldDescription.displayName = "FieldDescription"

interface FieldSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const FieldSeparator = React.forwardRef<HTMLDivElement, FieldSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative my-6 flex items-center text-sm",
        className
      )}
      {...props}
    >
      <div className="flex-grow border-t border-border" />
      {children && (
        <span className="mx-2 flex-shrink text-muted-foreground">
          {children}
        </span>
      )}
      <div className="flex-grow border-t border-border" />
    </div>
  )
)
FieldSeparator.displayName = "FieldSeparator"

export { Field, FieldGroup, FieldLabel, FieldDescription, FieldSeparator }