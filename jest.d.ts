import '@testing-library/jest-dom'

// Add TypeScript type declarations for jest-dom matchers
declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R
      toBeVisible(): R
      toHaveClass(className: string): R
      toHaveTextContent(text: string | RegExp): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveValue(value: string | number): R
      toBeChecked(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeEmpty(): R
      toContainElement(element: HTMLElement | null): R
      toContainHTML(html: string): R
      toHaveFocus(): R
      toHaveFormValues(values: Record<string, any>): R
      toHaveStyle(style: Record<string, string>): R
      toHaveDescription(text: string | RegExp): R
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R
      toHaveErrorMessage(text: string | RegExp): R
      toHaveRole(role: string): R
      toHaveAccessibleDescription(text: string | RegExp): R
      toHaveAccessibleName(text: string | RegExp): R
    }
  }
}