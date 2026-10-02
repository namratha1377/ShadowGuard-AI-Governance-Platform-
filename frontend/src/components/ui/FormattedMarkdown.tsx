import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let inTable = false;

  const renderInline = (text: string) => {
    // Process **bold**, `code`, and *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      // Code `text`
      const codeMatch = remaining.match(/`(.*?)`/);

      if (boldMatch && (!codeMatch || boldMatch.index! < codeMatch.index!)) {
        const idx = boldMatch.index!;
        if (idx > 0) {
          parts.push(remaining.slice(0, idx));
        }
        parts.push(
          <strong key={key++} className="font-semibold text-slate-100 dark:text-white">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(idx + boldMatch[0].length);
      } else if (codeMatch) {
        const idx = codeMatch.index!;
        if (idx > 0) {
          parts.push(remaining.slice(0, idx));
        }
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-950/80 text-indigo-300 border border-slate-800"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(idx + codeMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return parts;
  };

  const flushTable = (rows: string[], keyIndex: number) => {
    if (rows.length === 0) return null;
    const cleanRows = rows.filter((r) => !r.match(/^\|?\s*:?-+:?\s*\|/));
    if (cleanRows.length === 0) return null;

    const parseCells = (line: string) =>
      line
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === ''));

    const header = parseCells(cleanRows[0]);
    const body = cleanRows.slice(1).map(parseCells);

    return (
      <div key={`table-${keyIndex}`} className="my-2.5 overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          {header.length > 0 && (
            <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                {header.map((h, i) => (
                  <th key={i} className="px-3 py-1.5 font-mono">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/40">
                {row.map((cell, cIdx) => (
                  <th key={cIdx} className="px-3 py-1.5 font-normal text-slate-300">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Markdown Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRows.push(trimmed);
      return;
    } else if (inTable) {
      inTable = false;
      const tbl = flushTable(tableRows, idx);
      if (tbl) elements.push(tbl);
      tableRows = [];
    }

    if (!trimmed) {
      elements.push(<div key={idx} className="h-1.5" />);
      return;
    }

    // Headings (### or ##)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-xs font-bold uppercase font-mono tracking-wider text-indigo-400 mt-2 mb-1">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-sm font-extrabold text-slate-100 mt-2.5 mb-1">
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      return;
    }

    // Bullet points (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 pl-1 my-0.5 text-xs">
          <span className="text-indigo-400 font-bold select-none">•</span>
          <span className="flex-1 leading-relaxed text-slate-200">
            {renderInline(trimmed.replace(/^[-*]\s+/, ''))}
          </span>
        </div>
      );
      return;
    }

    // Normal paragraph
    elements.push(
      <p key={idx} className="text-xs leading-relaxed text-slate-200 my-0.5">
        {renderInline(line)}
      </p>
    );
  });

  if (inTable && tableRows.length > 0) {
    const tbl = flushTable(tableRows, lines.length);
    if (tbl) elements.push(tbl);
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};

export default FormattedMarkdown;
