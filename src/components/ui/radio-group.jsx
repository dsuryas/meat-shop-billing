import React from "react";
import { cn } from "@/lib/utils";

export const RadioGroup = ({
  children,
  value,
  onValueChange,
  disabled,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            checked: child.props.value === value,
            onChange: () => onValueChange(child.props.value),
            disabled,
          });
        }
        return child;
      })}
    </div>
  );
};

export const RadioGroupItem = ({
  children,
  value,
  checked,
  onChange,
  disabled,
}) => {
  return (
    <label
      className={cn(
        "flex items-center space-x-2 cursor-pointer",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
      />
      <span className="text-sm font-medium text-gray-900">{children}</span>
    </label>
  );
};
