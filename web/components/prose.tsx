import { cn } from "@/lib/utils";

/**
 * Lightweight prose wrapper for long-form legal copy. Styles descendant
 * elements via Tailwind selectors so pages can be written as semantic HTML
 * (no @tailwindcss/typography dependency).
 */
export function Prose({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground text-pretty",
        "[&>h2]:mt-10 [&>h2]:font-heading [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:tracking-tight [&>h2]:text-foreground",
        "[&>h3]:mt-6 [&>h3]:font-medium [&>h3]:text-foreground",
        "[&>p]:mt-4 [&>p]:leading-relaxed",
        "[&>ul]:mt-4 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-5",
        "[&>ol]:mt-4 [&>ol]:list-decimal [&>ol]:space-y-2 [&>ol]:pl-5",
        "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4",
        "[&_strong]:font-medium [&_strong]:text-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        className,
      )}
    >
      {children}
    </div>
  );
}
