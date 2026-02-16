import { cn } from "@/lib/utils";

type LoopLogoProps = {
  className?: string;
  textClassName?: string;
  markClassName?: string;
  showText?: boolean;
};

export default function LoopLogo({
  className,
  textClassName,
  markClassName,
  showText = true,
}: LoopLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-xl bg-black text-white",
          markClassName,
        )}
        aria-hidden="true"
      >
        <span className="text-lg font-black tracking-tight">L</span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500" />
      </div>
      {showText ? (
        <div className={cn("text-2xl font-black tracking-[0.18em] text-black", textClassName)}>
          LOOP
        </div>
      ) : null}
    </div>
  );
}
