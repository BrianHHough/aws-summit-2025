/**
 * Converts an email address to a handle format
 * e.g., "user.name@gmail.com" becomes "@user.name"
 */
export function emailToHandle(email?: string | null): string {
  if (!email) return "@user";
  
  const parts = email.split('@');
  if (parts.length < 2) return `@${email}`;
  
  return `@${parts[0]}`;
}