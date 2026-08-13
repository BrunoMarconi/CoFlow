export type DetailTransitionKind = "property" | "community" | "person";

export function detailTransitionName(
  kind: DetailTransitionKind,
  id: string | number
) {
  return `coflow-${kind}-${String(id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
