import { ArrowUpRight } from "lucide-react";
import { content } from "../data/content";
import { principles } from "../data/principles";
import { SectionHeader } from "./SectionHeader";
import { TermBar } from "./Terminal";

export function Principles() {
  return (
    <section
      className="section"
      id="principles"
      aria-labelledby="principles-title"
    >
      <div className="container">
        <SectionHeader
          command="cat PRINCIPLES.md"
          title="How I Think"
          titleId="principles-title"
        >
          The rules I build by. Each one links to the system where it was tested
          in production.
        </SectionHeader>

        <div className="term principles-term">
          <TermBar
            title="~/PRINCIPLES.md"
            meta={`${principles.length} principles`}
          />
          <ol className="principles-grid">
            {principles.map((item, index) => {
              const source = content.cases.find((c) => c.id === item.caseId);
              return (
                <li className="principle" key={item.id}>
                  <h3 className="principle-title">
                    <span className="principle-hash" aria-hidden="true">
                      ## {String(index + 1).padStart(2, "0")}{" "}
                    </span>
                    {item.title}
                  </h3>
                  <p className="principle-belief">{item.belief}</p>
                  <p className="principle-practice">
                    <span className="principle-label">in practice: </span>
                    {item.practice}
                  </p>
                  {source ? (
                    <a className="principle-link" href={`#case-${source.id}`}>
                      case {source.index} · {source.title}
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
