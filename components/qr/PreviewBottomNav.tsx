import { FileText, Home, ScanLine, User } from 'lucide-react';

/**
 * Static, non-interactive copy of `components/app/bottom-nav.tsx`. Used
 * inside the QR builder's device preview where we want the visual feel
 * of the worker BottomNav without the Next.js `<Link>` + `usePathname`
 * machinery (the preview lives on /dashboard/qr/new and any pathname
 * read would always say "no item active" anyway). No item is rendered
 * as active — that matches the live `/app/external` route, which sits
 * outside every BottomNav item's prefix match.
 */
export function PreviewBottomNav() {
  const items = [
    { key: 'home', label: 'Home', Icon: Home },
    { key: 'scan', label: 'Scan', Icon: ScanLine },
    { key: 'sops', label: 'SOPs', Icon: FileText },
    { key: 'profile', label: 'Profile', Icon: User },
  ] as const;

  return (
    <nav
      aria-hidden
      className="shrink-0 border-t border-dc-edge bg-dc-surface/95 backdrop-blur"
    >
      <ul className="flex items-stretch justify-around">
        {items.map(({ key, label, Icon }) => (
          <li key={key} className="flex-1">
            <span className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-medium text-dc-text-2">
              <Icon className="size-5" strokeWidth={2} aria-hidden />
              {label}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
