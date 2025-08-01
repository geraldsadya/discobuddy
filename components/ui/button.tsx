import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "default";
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-colors focus:outline-none",
          variant === "ghost" ? "bg-transparent hover:bg-gray-100" : "bg-blue-600 text-white hover:bg-blue-700",
          size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-base",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
