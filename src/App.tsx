import { useEffect, useState } from "react";
import { CaseStudies } from "./components/CaseStudies";
import { CommandPalette } from "./components/CommandPalette";
import { Contact } from "./components/Contact";
import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import { Header } from "./components/Header";
import { Dashboards } from "./components/Dashboards";
import { Hero } from "./components/Hero";
import { Principles } from "./components/Principles";
import { Reports } from "./components/Reports";
import { Skills } from "./components/Skills";
import { StatusBar } from "./components/StatusBar";
import { useTheme } from "./lib/theme";

function App() {
  const { theme, toggleTheme } = useTheme();
  const [consoleOpen, setConsoleOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setConsoleOpen((open) => !open);
      }
      if (event.key === "Escape") setConsoleOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenConsole={() => setConsoleOpen(true)}
      />
      <main id="main-content">
        <Hero />
        <Dashboards />
        <Principles />
        <CaseStudies />
        <Reports />
        <Skills />
        <Experience />
        <Education />
        <Contact />
      </main>
      <StatusBar />
      <CommandPalette
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        onToggleTheme={toggleTheme}
      />
    </>
  );
}

export default App;
