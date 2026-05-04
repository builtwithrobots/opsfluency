import type { ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

/**
 * SOP-flavoured Markdown renderer. Backed by `react-markdown` +
 * `remark-gfm` so we get tables, task lists, strikethrough, autolinks,
 * and nested structures for free. The component overrides below keep
 * the brand styling that the previous in-house renderer produced —
 * branded callouts for blockquotes, brand-coloured ordered-list
 * markers, and OpsFluency type scale for headings.
 *
 * Callout tone is still inferred from a leading `**Warning:**` /
 * `**Caution:**` / `**Note:**` marker inside a blockquote, matching
 * the conversion prompt's contract with Sonnet.
 */

interface RenderOptions {
  className?: string;
}

const CALLOUT_PATTERNS: { keyword: string; tone: 'warn' | 'urgent' | 'info' }[] = [
  { keyword: 'Warning', tone: 'urgent' },
  { keyword: 'Danger',  tone: 'urgent' },
  { keyword: 'Caution', tone: 'warn'   },
  { keyword: 'Note',    tone: 'info'   },
  { keyword: 'Tip',     tone: 'info'   },
];

const TONE_CLASSES: Record<'warn' | 'urgent' | 'info', string> = {
  urgent: 'border-(--color-signal-urgent) bg-(--color-signal-urgent)/5',
  warn:   'border-(--color-signal-warn)   bg-(--color-signal-warn)/5',
  info:   'border-(--color-signal-info)   bg-(--color-signal-info)/5',
};

/**
 * `react-markdown` hands children to a blockquote override as a node
 * tree, not as flat text. Walk it once to figure out which callout
 * tone (if any) the leading `**Keyword:**` matches.
 */
function calloutToneFromChildren(children: ReactNode): 'warn' | 'urgent' | 'info' {
  const flat = flattenText(children).trimStart();
  for (const p of CALLOUT_PATTERNS) {
    // Match `Warning:` / `Warning ` either bolded (the prompt's contract) or plain.
    const re = new RegExp(`^(?:\\*\\*)?${p.keyword}:?(?:\\*\\*)?\\b`, 'i');
    if (re.test(flat)) return p.tone;
  }
  return 'info';
}

function flattenText(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (typeof node === 'object' && 'props' in node) {
    return flattenText((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

const components: Components = {
  h1: ({ children, id }) => (
    <h2 id={id} className="font-display mt-2 mb-4 text-2xl font-bold text-dc-text">{children}</h2>
  ),
  h2: ({ children, id }) => (
    <h3 id={id} className="mt-6 mb-3 text-xl font-semibold text-dc-text">{children}</h3>
  ),
  h3: ({ children, id }) => (
    <h4 id={id} className="mt-5 mb-2 text-lg font-semibold text-dc-text">{children}</h4>
  ),
  h4: ({ children, id }) => (
    <h5 id={id} className="mt-4 mb-2 text-base font-semibold text-dc-text">{children}</h5>
  ),
  h5: ({ children, id }) => (
    <h6 id={id} className="mt-4 mb-2 text-base font-semibold text-dc-text">{children}</h6>
  ),
  h6: ({ children, id }) => (
    <h6 id={id} className="mt-4 mb-2 text-base font-semibold text-dc-text">{children}</h6>
  ),

  p: ({ children }) => (
    <p className="my-3 leading-relaxed text-dc-text">{children}</p>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-dc-text">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-dc-text-3 line-through">{children}</del>,

  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="text-(--color-brand) underline decoration-(--color-brand)/40 underline-offset-2 hover:decoration-(--color-brand)"
    >
      {children}
    </a>
  ),

  code: ({ children, ...props }) => {
    // Distinguish inline code from fenced code blocks. `react-markdown`
    // renders fenced blocks as <pre><code>, so the parent of a fenced
    // code is the <pre> override below; here we only style inline.
    const isInline = !(props as { className?: string }).className;
    if (!isInline) return <code {...props}>{children}</code>;
    return (
      <code className="rounded bg-dc-raised px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-md border border-[color:var(--dc-edge)] bg-dc-raised p-3 font-mono text-[0.85em] text-dc-text">
      {children}
    </pre>
  ),

  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-2 pl-6 text-dc-text marker:font-semibold marker:text-(--color-brand)">
      {children}
    </ol>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-2 pl-6 text-dc-text marker:text-dc-text-3">
      {children}
    </ul>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  blockquote: ({ children }) => {
    const tone = calloutToneFromChildren(children);
    const toneCls = TONE_CLASSES[tone];
    return (
      <blockquote className={`my-4 rounded-md border-l-4 px-4 py-3 ${toneCls}`}>
        {children}
      </blockquote>
    );
  },

  hr: () => <hr className="my-6 border-t border-[color:var(--dc-edge)]" />,

  // GFM tables — the entire reason for the swap. Real <table> elements
  // (accessible to screen readers + keyboard nav) with light brand chrome.
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-[color:var(--dc-edge)]">
      <table className="w-full border-collapse text-sm text-dc-text">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-dc-raised text-left text-xs font-semibold tracking-wide text-dc-text-2 uppercase">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-[color:var(--dc-edge)]">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children, style }) => (
    <th style={style} className="px-3 py-2 align-top">{children}</th>
  ),
  td: ({ children, style }) => (
    <td style={style} className="px-3 py-2 align-top leading-relaxed">{children}</td>
  ),

  // GFM task lists — `[ ]` / `[x]`. react-markdown renders the
  // checkbox; we restyle it lightly for legibility on warehouse floors.
  input: (props) => {
    if ((props as { type?: string }).type === 'checkbox') {
      return (
        <input
          {...props}
          disabled
          className="mr-1.5 size-4 translate-y-0.5 rounded border-[color:var(--dc-edge)] text-(--color-brand) accent-(--color-brand)"
        />
      );
    }
    return <input {...props} />;
  },

  img: ({ src, alt }) => {
    if (!src || typeof src !== 'string') return null;
    return (
      // SOP images can be arbitrary widths/heights and live on Supabase
      // signed URLs — next/image's optimisation pipeline can't be hit
      // without a configured loader for that domain. Plain <img> is fine.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ''}
        className="my-4 max-w-full rounded-md border border-[color:var(--dc-edge)]"
      />
    );
  },
};

export function renderMarkdown(source: string, opts: RenderOptions = {}): ReactNode {
  return (
    <div className={opts.className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
