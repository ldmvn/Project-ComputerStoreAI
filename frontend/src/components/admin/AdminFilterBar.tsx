interface AdminFilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export default function AdminFilterBar({ children, className }: AdminFilterBarProps) {
  return (
    <div className={`mb-4 rounded-xl border border-slate-200 bg-white${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
