import type { ReactNode } from 'react';

/**
 * Tiny SOP-flavoured Markdown → JSX renderer. Handles the subset Sonnet's
 * conversion prompt produces: headings, ordered/unordered lists, blockquotes
 * (used for Warning/Caution/Note callouts), paragraphs, and inline `**bold**`,
 * `*italic*`, `` `code` ``. Pulling in `react-markdown` + remark/rehype for
 * MVP would balloon the bundle for one feature; this stays in app code.
 *
 * Not handled (yet): nested lists, tables, raw HTML, images. If a customer
 * SOP actually uses one of these, swap this for a real markdown lib.
 */

interface RenderOptions {
  className?: string;
}

const CALLOUT_PATTERNS: { keyword: string; tone: 'warn' | 'urgent' | 'info' }[] = [
  { keyword: 'Warning', tone: 'urgent' },
  { keyword: 'Danger', tone: 'urgent' },
  { keyword: 'Caution', tone: 'warn' },
  { keyword: 'Note', tone: 'info' },
  { keyword: 'Tip', tone: 'info' },
];

function inline(line: string, keyPrefix: string): ReactNode[] {
  // Order: code → bold → italic. Code spans don't get further parsed.
  const out: ReactNode[] = [];
  let i = 0;
  let buf = '';
  let key = 0;

  function flush() {
    if (buf) {
      out.push(buf);
      buf = '';
    }
  }

  while (i < line.length) {
    const c = line[i];

    if (c === '`') {
      const end = line.indexOf('`', i + 1);
      if (end !== -1) {
        flush();
        out.push(
          <code key={`${keyPrefix}-c-${key++}`} className="rounded bg-dc-raised px-1 py-0.5 font-mono text-[0.85em]">
            {line.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }
    if (c === '*' && line[i + 1] === '*') {
      const end = line.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        out.push(
          <strong key={`${keyPrefix}-b-${key++}`} className="font-semibold text-dc-text">
            {inline(line.slice(i + 2, end), `${keyPrefix}-${key}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }
    if (c === '*') {
      const end = line.indexOf('*', i + 1);
      if (end !== -1 && end !== i + 1) {
        flush();
        out.push(
          <em key={`${keyPrefix}-i-${key++}`} className="italic">
            {inline(line.slice(i + 1, end), `${keyPrefix}-${key}`)}
          </em>,
        );
        i = end + 1;
        continue;
      }
    }
    buf += c;
    i++;
  }
  flush();
  return out;
}

interface Block {
  render: () => ReactNode;
}

function classifyBlock(lines: string[], startIdx: number): { block: Block; consumed: number } {
  const line = lines[startIdx];

  // Heading
  const h = /^(#{1,4})\s+(.*)$/.exec(line);
  if (h) {
    const level = h[1].length;
    const text = h[2];
    const sizeCls =
      level === 1 ? 'text-2xl font-display font-bold mt-2 mb-4' :
      level === 2 ? 'text-xl font-semibold mt-6 mb-3' :
      level === 3 ? 'text-lg font-semibold mt-5 mb-2' :
      'text-base font-semibold mt-4 mb-2';
    return {
      consumed: 1,
      block: {
        render: () => {
          const cls = `${sizeCls} text-dc-text`;
          const children = inline(text, `h${startIdx}`);
          if (level === 1) return <h2 className={cls}>{children}</h2>;
          if (level === 2) return <h3 className={cls}>{children}</h3>;
          if (level === 3) return <h4 className={cls}>{children}</h4>;
          return <h5 className={cls}>{children}</h5>;
        },
      },
    };
  }

  // Blockquote (callout)
  if (line.startsWith('> ')) {
    let i = startIdx;
    const collected: string[] = [];
    while (i < lines.length && lines[i].startsWith('> ')) {
      collected.push(lines[i].slice(2));
      i++;
    }
    const joined = collected.join('\n');
    let tone: 'warn' | 'urgent' | 'info' = 'info';
    for (const p of CALLOUT_PATTERNS) {
      if (new RegExp(`^\\*\\*${p.keyword}:?\\*\\*`, 'i').test(joined)) {
        tone = p.tone;
        break;
      }
    }
    const toneCls =
      tone === 'urgent' ? 'border-(--color-signal-urgent) bg-(--color-signal-urgent)/5' :
      tone === 'warn' ? 'border-(--color-signal-warn) bg-(--color-signal-warn)/5' :
      'border-(--color-signal-info) bg-(--color-signal-info)/5';
    return {
      consumed: i - startIdx,
      block: {
        render: () => (
          <blockquote className={`my-4 rounded-md border-l-4 px-4 py-3 ${toneCls}`}>
            {collected.map((l, idx) => (
              <p key={idx} className="text-dc-text leading-relaxed">{inline(l, `bq${startIdx}-${idx}`)}</p>
            ))}
          </blockquote>
        ),
      },
    };
  }

  // Ordered list
  if (/^\d+\.\s+/.test(line)) {
    let i = startIdx;
    const items: string[] = [];
    while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
      items.push(lines[i].replace(/^\d+\.\s+/, ''));
      i++;
    }
    return {
      consumed: i - startIdx,
      block: {
        render: () => (
          <ol className="my-3 list-decimal space-y-2 pl-6 text-dc-text marker:text-(--color-brand) marker:font-semibold">
            {items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">{inline(it, `ol${startIdx}-${idx}`)}</li>
            ))}
          </ol>
        ),
      },
    };
  }

  // Unordered list
  if (/^[-*]\s+/.test(line)) {
    let i = startIdx;
    const items: string[] = [];
    while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
      items.push(lines[i].replace(/^[-*]\s+/, ''));
      i++;
    }
    return {
      consumed: i - startIdx,
      block: {
        render: () => (
          <ul className="my-3 list-disc space-y-2 pl-6 text-dc-text marker:text-dc-text-3">
            {items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">{inline(it, `ul${startIdx}-${idx}`)}</li>
            ))}
          </ul>
        ),
      },
    };
  }

  // Blank line
  if (!line.trim()) {
    return { consumed: 1, block: { render: () => null } };
  }

  // Paragraph: gather contiguous non-empty, non-special lines.
  let i = startIdx;
  const para: string[] = [];
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) break;
    if (/^(#{1,4})\s+/.test(l)) break;
    if (l.startsWith('> ')) break;
    if (/^\d+\.\s+/.test(l)) break;
    if (/^[-*]\s+/.test(l)) break;
    para.push(l);
    i++;
  }
  return {
    consumed: i - startIdx,
    block: {
      render: () => (
        <p className="my-3 text-dc-text leading-relaxed">
          {para.map((l, idx) => (
            <span key={idx}>
              {inline(l, `p${startIdx}-${idx}`)}
              {idx < para.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ),
    },
  };
}

export function renderMarkdown(source: string, opts: RenderOptions = {}): ReactNode {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const { block, consumed } = classifyBlock(lines, i);
    const node = block.render();
    if (node) blocks.push(<div key={`blk-${i}`}>{node}</div>);
    i += Math.max(1, consumed);
  }
  return <div className={opts.className}>{blocks}</div>;
}
