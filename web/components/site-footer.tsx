import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/site";

type FooterLink = { title: string; href: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { title: "What it is", href: "/#what" },
      { title: "How it works", href: "/#how" },
      { title: "Open source", href: "/#open-source" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Privacy", href: "/privacy" },
      { title: "Terms", href: "/terms" },
      { title: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Connect",
    links: [
      { title: "GitHub", href: siteConfig.links.connectRepo, external: true },
      { title: "Cremind.io", href: siteConfig.links.cremind, external: true },
      { title: "Email support", href: `mailto:${siteConfig.contactEmail}` },
    ],
  },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.title}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.title}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-heading text-base font-semibold">
            <Image
              src="/logo.png"
              alt=""
              width={24}
              height={24}
              className="rounded-md"
            />
            {siteConfig.name}
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            A token-less OAuth broker and event relay for the open-source Cremind
            assistant. It moves notifications, never your data.
          </p>
        </div>
        {columns.map((col) => (
          <FooterColumn key={col.title} title={col.title} links={col.links} />
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>
            © {siteConfig.copyrightYear} Cremind · MIT License
          </span>
          <span>{siteConfig.host}</span>
        </div>
      </div>
    </footer>
  );
}
