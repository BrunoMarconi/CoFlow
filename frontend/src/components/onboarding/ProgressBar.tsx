export default function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed left-0 top-0 z-50 h-2 w-full bg-border">
      <div
        className="h-full rounded-r-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
