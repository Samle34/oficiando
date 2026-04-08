import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "brand" | "outline" | "whatsapp" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const styles: Record<Variant, string> = {
  brand:
    "bg-brand text-white hover:bg-brand-hover active:scale-[0.98]",
  outline:
    "bg-transparent text-primary border border-primary hover:bg-primary hover:text-white active:scale-[0.98]",
  whatsapp:
    "bg-whatsapp text-white hover:bg-whatsapp-hover active:scale-[0.98]",
  ghost:
    "bg-transparent text-secondary hover:text-primary hover:bg-black/5 active:scale-[0.98]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "brand", fullWidth = false, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          "inline-flex items-center justify-center gap-2",
          "h-11 px-5 rounded-md",
          "text-sm font-semibold",
          "transition-all duration-150 ease-out",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "select-none cursor-pointer",
          styles[variant],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
