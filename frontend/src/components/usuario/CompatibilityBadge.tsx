import Badge from "@/components/ui/Badge";

export default function CompatibilityBadge({ compatibility }: { compatibility: number }) {
  const variant =
    compatibility >= 75 ? "success" : compatibility >= 50 ? "default" : "warning";

  return <Badge variant={variant}>{compatibility}% compatible</Badge>;
}
