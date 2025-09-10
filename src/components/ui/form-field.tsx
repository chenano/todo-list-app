"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

interface FormFieldProps {
  children: React.ReactNode
  label?: string
  error?: string | string[]
  success?: string
  description?: string
  required?: boolean
  className?: string
}

export function FormField({
  children,
  label,
  error,
  success,
  description,
  required,
  className,
}: FormFieldProps) {
  const id = React.useId()
  const errorMessages = Array.isArray(error) ? error : error ? [error] : []
  const hasError = errorMessages.length > 0

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label 
          htmlFor={id} 
          className={cn(
            "text-sm font-medium",
            hasError && "text-red-700",
            success && "text-green-700"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          "aria-describedby": [
            hasError ? errorMessages.map((_, i) => `${id}-error-${i}`).join(' ') : '',
            success ? `${id}-success` : '',
            description ? `${id}-description` : ''
          ].filter(Boolean).join(' ') || undefined,
          "aria-invalid": hasError ? "true" : undefined,
          className: cn(
            (children as React.ReactElement).props.className,
            hasError && "border-red-500 focus-visible:ring-red-500",
            success && "border-green-500 focus-visible:ring-green-500"
          )
        })}
      </div>
      
      {/* Description text */}
      {description && !hasError && !success && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p id={`${id}-description`}>{description}</p>
        </div>
      )}
      
      {/* Success message */}
      {success && !hasError && (
        <div className="flex items-start gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p id={`${id}-success`}>{success}</p>
        </div>
      )}
      
      {/* Error messages */}
      {hasError && (
        <div className="space-y-1">
          {errorMessages.map((errorMsg, index) => (
            <div 
              key={index}
              className="flex items-start gap-2 text-sm text-red-600"
              role="alert"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p id={`${id}-error-${index}`}>{errorMsg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Enhanced form validation utilities
export interface FieldValidation {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface FormValidationState {
  [fieldName: string]: FieldValidation
}

export function useFormValidation() {
  const [validationState, setValidationState] = React.useState<FormValidationState>({})

  const setFieldValidation = React.useCallback((fieldName: string, validation: FieldValidation) => {
    setValidationState(prev => ({
      ...prev,
      [fieldName]: validation
    }))
  }, [])

  const clearFieldValidation = React.useCallback((fieldName: string) => {
    setValidationState(prev => {
      const newState = { ...prev }
      delete newState[fieldName]
      return newState
    })
  }, [])

  const clearAllValidation = React.useCallback(() => {
    setValidationState({})
  }, [])

  const getFieldError = React.useCallback((fieldName: string): string[] => {
    return validationState[fieldName]?.errors || []
  }, [validationState])

  const getFieldWarnings = React.useCallback((fieldName: string): string[] => {
    return validationState[fieldName]?.warnings || []
  }, [validationState])

  const isFieldValid = React.useCallback((fieldName: string): boolean => {
    return validationState[fieldName]?.isValid !== false
  }, [validationState])

  const isFormValid = React.useCallback((): boolean => {
    return Object.values(validationState).every(validation => validation.isValid)
  }, [validationState])

  const getFormErrors = React.useCallback((): string[] => {
    return Object.values(validationState)
      .flatMap(validation => validation.errors)
      .filter(Boolean)
  }, [validationState])

  return {
    validationState,
    setFieldValidation,
    clearFieldValidation,
    clearAllValidation,
    getFieldError,
    getFieldWarnings,
    isFieldValid,
    isFormValid,
    getFormErrors
  }
}