export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;

  const visible = local.slice(0, 2);
  const hidden = "*".repeat(Math.max(local.length - visible.length, 3));
  return `${visible}${hidden}@${domain}`;
}
