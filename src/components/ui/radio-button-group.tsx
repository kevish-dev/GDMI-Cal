import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

interface RadioButtonGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
}

const RadioButtonGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioButtonGroupProps
>(({ className, options, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root 
      className={cn("flex flex-wrap gap-2", className)} 
      {...props} 
      ref={ref}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "flex flex-col items-center justify-center px-3 py-2 rounded-md border text-sm font-medium transition-all duration-200 cursor-pointer",
            "text-gray-500 border-gray-400 bg-white hover:text-gray-700 hover:border-gray-500 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
            "data-[state=checked]:text-white data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:shadow-lg data-[state=checked]:scale-[1.02]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:data-[state=checked]:bg-primary/20 dark:hover:bg-gray-800/50"
          )}
        >
          <span className="text-center">{option.label}</span>
          {option.description && (
            <span className="text-xs opacity-70 text-center mt-1">
              {option.description}
            </span>
          )}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
});
RadioButtonGroup.displayName = "RadioButtonGroup";

export { RadioButtonGroup };