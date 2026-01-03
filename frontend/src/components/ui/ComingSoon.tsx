interface ComingSoonProps {
  children: React.ReactNode;
  active?: boolean;
}

export function ComingSoon({ children, active = true }: ComingSoonProps) {
  if (!active) return <>{children}</>;

  return (
    <div className="relative isolate overflow-hidden rounded-lg">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold shadow-sm transform transition-all hover:scale-105 select-none">
          Coming Soon
        </div>
      </div>
      <div className="opacity-50 pointer-events-none select-none grayscale-[0.3] filter blur-[0.5px]">
        {children}
      </div>
    </div>
  );
}
