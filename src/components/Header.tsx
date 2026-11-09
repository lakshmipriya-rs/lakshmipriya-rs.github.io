import { useEffect, useState } from "react";
import { Command, Download, Menu, Moon, Send, Sun, X } from "lucide-react";
import { content } from "../data/content";
import type { Theme } from "../lib/theme";

// tmux-style window list: index, name, and "*" on the active window.
const NAV_ITEMS = [
  { id: "dashboards", label: "dashboards" },
  { id: "principles", label: "principles" },
  { id: "cases", label: "cases" },
  { id: "reports", label: "reports" },
  { id: "skills", label: "skills" },
  { id: "experience", label: "experience" },
  { id: "contact", label: "contact" },
] as const;

const base = import.meta.env.BASE_URL;

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // The hero is observed too, so scrolling back to the top clears the tab.
    const sections = ["hero", ...NAV_ITEMS.map(({ id }) => id)]
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0])
          setActive(
            visible[0].target.id === "hero" ? null : visible[0].target.id,
          );
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return active;
}

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenConsole: () => void;
}

export function Header({ theme, onToggleTheme, onOpenConsole }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 1140) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  const links = (onClick?: () => void) =>
    NAV_ITEMS.map((item, index) => (
      <a
        key={item.id}
        href={`#${item.id}`}
        onClick={onClick}
        aria-current={active === item.id ? "true" : undefined}
      >
        <span className="tab-index">{index + 1}:</span>
        {item.label}
        <span className="tab-flag" aria-hidden="true">
          {active === item.id ? "*" : ""}
        </span>
      </a>
    ));

  return (
    <header className={menuOpen ? "site-header menu-open" : "site-header"}>
      <div className="site-header-inner">
        <a className="wordmark" href="#hero" onClick={close}>
          <span aria-hidden="true">
            <span className="wordmark-user">lp@ops</span>
            <span className="wordmark-path">:~$</span>
          </span>
          <span className="sr-only">{content.name} — home</span>
        </a>

        <nav className="nav" aria-label="Primary">
          {links()}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            className="console-trigger"
            type="button"
            onClick={onOpenConsole}
            aria-label="Open command console"
          >
            <Command size={13} aria-hidden="true" />
            <kbd>⌘K</kbd>
          </button>
          <a
            className="button button-primary button-sm header-cta"
            href="#contact"
          >
            <Send size={13} aria-hidden="true" /> Contact me
          </a>
          <button
            className="icon-button menu-trigger"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <div className="mobile-menu" id="mobile-menu" hidden={!menuOpen}>
        <nav aria-label="Mobile">{links(close)}</nav>
        <div className="mobile-menu-actions">
          <a className="button button-primary" href="#contact" onClick={close}>
            <Send size={14} aria-hidden="true" /> Contact me
          </a>
          <a
            className="button button-secondary"
            href={`${base}${content.resume}`}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            <Download size={14} aria-hidden="true" /> Download resume
          </a>
        </div>
      </div>
    </header>
  );
}
