import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { content } from "../data/content";
import { scrollToId } from "../lib/motion";

type OutputMode = "yaml" | "json" | "plain";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
}

const base = import.meta.env.BASE_URL;

const COMMANDS: { name: string; hint: string }[] = [
  { name: "whoami", hint: "back to the top" },
  { name: "ls cases", hint: "all case studies" },
  ...content.cases.map((item) => ({
    name: `open ${item.id}`,
    hint: item.title,
  })),
  { name: "open dashboards", hint: "platform dashboards" },
  { name: "cat principles", hint: "how I think" },
  { name: "ls reports", hint: "sample reports (synthetic data)" },
  { name: "skills", hint: "skills & tools" },
  { name: "log", hint: "experience" },
  { name: "education", hint: "degrees" },
  { name: "contact", hint: "email · linkedin · github" },
  { name: "wget resume.pdf", hint: "download resume" },
  { name: "theme", hint: "toggle light / dark" },
  { name: "clear", hint: "clear history" },
];

const TARGETS: Record<string, string> = {
  whoami: "hero",
  "ls cases": "cases",
  "open dashboards": "dashboards",
  "cat principles": "principles",
  "ls reports": "reports",
  skills: "skills",
  log: "experience",
  education: "education",
  contact: "contact",
};

export function CommandPalette({
  open,
  onClose,
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<OutputMode>("yaml");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      COMMANDS.filter(({ name, hint }) =>
        `${name} ${hint}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  // On open: reset, focus the input, and keep Tab inside the dialog.
  // On close: hand focus back to whatever opened the console.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    setQuery("");
    setCursor(0);
    inputRef.current?.focus();

    const trapTab = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "input, button:not([tabindex='-1'])",
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapTab);
    return () => {
      document.removeEventListener("keydown", trapTab);
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const run = (name: string) => {
    if (name === "clear") {
      setHistory([]);
      setQuery("");
      return;
    }
    setHistory((items) =>
      [name, ...items.filter((i) => i !== name)].slice(0, 5),
    );
    if (name === "theme") {
      onToggleTheme();
      return;
    }
    if (name === "wget resume.pdf") {
      window.open(`${base}${content.resume}`, "_blank", "noopener");
    } else if (name.startsWith("open ")) {
      scrollToId(`case-${name.slice(5)}`);
    } else if (TARGETS[name]) {
      scrollToId(TARGETS[name]);
    }
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter" && filtered[cursor]) {
      event.preventDefault();
      run(filtered[cursor].name);
    }
  };

  const profile = {
    name: content.name,
    role: content.role,
    focus: content.focus.join(", "),
    location: content.location,
    open_to_relocation: true,
    email: content.email,
  };
  const output =
    mode === "yaml"
      ? Object.entries(profile)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      : mode === "json"
        ? JSON.stringify(profile, null, 2)
        : `${content.name}\n${content.focus.join(" · ")} · ${content.location}\n${content.email}`;

  return (
    <div className="console-backdrop">
      <button
        className="console-scrim"
        type="button"
        tabIndex={-1}
        aria-label="Close console"
        onClick={onClose}
      />
      <div
        className="console"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command console"
      >
        <div className="console-input">
          <span aria-hidden="true">lakshmipriya@ops:~$</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="type a command…"
            aria-label="Command"
            aria-controls="console-commands"
            aria-activedescendant={
              filtered[cursor] ? `console-cmd-${cursor}` : undefined
            }
            role="combobox"
            aria-expanded="true"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <ul className="command-list" id="console-commands" role="listbox">
          {filtered.map((command, index) => (
            <li
              key={command.name}
              id={`console-cmd-${index}`}
              role="option"
              aria-selected={index === cursor}
              className={index === cursor ? "command active" : "command"}
              tabIndex={-1}
              onMouseEnter={() => setCursor(index)}
              onClick={() => run(command.name)}
              onKeyDown={(event) => {
                if (event.key === "Enter") run(command.name);
              }}
            >
              <span className="command-name">{command.name}</span>
              <span className="command-hint">{command.hint}</span>
              {index === cursor ? <kbd>↵</kbd> : null}
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="command command-empty">no matching command</li>
          ) : null}
        </ul>
        {history.length ? (
          <div className="history">
            <span>history</span>
            {history.map((item) => (
              <code key={item}>{item}</code>
            ))}
          </div>
        ) : null}
        <div className="console-resume">
          <div className="mode-tabs" role="tablist" aria-label="Profile format">
            {(["yaml", "json", "plain"] as const).map((item) => (
              <button
                className={mode === item ? "selected" : ""}
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <pre>{output}</pre>
        </div>
        <p className="console-hint">
          ↑ ↓ to move · enter to run · esc to close
        </p>
      </div>
    </div>
  );
}
