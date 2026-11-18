"use client"

import * as React from "react"
import { useController, type UseFormReturn, type ControllerFieldState } from "react-hook-form"
import { cn } from "cn"
import { Label } from "@/components/ui/label"

const FormContext = React.createContext<UseFormReturn | null>(null)

export function Form({
  children,
  ...props
}: {
  children?: React.ReactNode
} & Record<string, any>) {
  return (
    <FormContext.Provider value={props as UseFormReturn}>
      {children}
    </FormContext.Provider>
  )
}

type FormFieldRenderArgs = {
  field: {
    onChange: (...event: any[]) => void
    onBlur: () => void
    value: any
    disabled?: boolean
    name: string
    ref: (instance: any) => void
  }
  fieldState: ControllerFieldState
}

const FormFieldContext = React.createContext<{
  fieldState: ControllerFieldState
} | null>(null)

type FormFieldOwnProps = {
  control?: any
  name: string
  disabled?: boolean
  render: (args: FormFieldRenderArgs) => React.ReactNode
}

export const FormField = React.forwardRef<
  HTMLDivElement,
  FormFieldOwnProps & Omit<React.ComponentPropsWithoutRef<"div">, "ref">
>(
  ({ control, name, disabled, render, className, ...props }, ref) => {
    const ctx = React.useContext(FormContext)
    const c = control || ctx?.control
    const { field, fieldState } = useController({
      name,
      control: c as any,
      disabled,
    })

    return (
      <FormFieldContext.Provider value={{ fieldState }}>
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(className)}
          {...props}
        >
          {render({ field, fieldState })}
        </div>
      </FormFieldContext.Provider>
    )
  }
)

export function FormItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />
}

export function FormLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label>) {
  return (
    <Label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export function FormControl({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn(className)} {...props} />
}

export function FormMessage({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { children?: React.ReactNode }) {
  const ctx = React.useContext(FormFieldContext)
  const error = ctx?.fieldState?.error

  if (!error) {
    return null
  }

  return (
    <div className={cn("text-sm text-destructive", className)} {...props}>
      {children ?? error.message}
    </div>
  )
}
