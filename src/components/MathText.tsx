import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'inline'; value: string }
  | { kind: 'block'; value: string };

function splitMathSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ kind: 'text', value: input.slice(lastIdx, match.index) });
    }
    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({ kind: 'block', value: token.slice(2, -2).trim() });
    } else {
      segments.push({ kind: 'inline', value: token.slice(1, -1).trim() });
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < input.length) {
    segments.push({ kind: 'text', value: input.slice(lastIdx) });
  }
  return segments;
}

export function MathText({ text, className = '' }: MathTextProps) {
  const lines = String(text || '').split('\n');

  return (
    <span className={className}>
      {lines.map((line, lineIdx) => {
        const segments = splitMathSegments(line);
        return (
          <span key={lineIdx} className={lineIdx > 0 ? 'mt-1.5 block' : undefined}>
            {segments.map((seg, idx) => {
              if (seg.kind === 'text') {
                return <span key={idx}>{seg.value}</span>;
              }
              try {
                const html = katex.renderToString(seg.value, {
                  displayMode: seg.kind === 'block',
                  throwOnError: false,
                  strict: false,
                });
                if (seg.kind === 'block') {
                  return (
                    <span
                      key={idx}
                      dir="ltr"
                      className="my-2 block overflow-x-auto text-center"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                }
                return (
                  <span
                    key={idx}
                    dir="ltr"
                    className="math-inline mx-0.5 inline-block align-middle"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch {
                return (
                  <code key={idx} dir="ltr" className="mx-1 rounded bg-[#EFE8FE] px-1.5 py-0.5 text-xs">
                    {seg.value}
                  </code>
                );
              }
            })}
          </span>
        );
      })}
    </span>
  );
}
