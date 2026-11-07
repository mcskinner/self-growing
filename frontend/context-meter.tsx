export interface ContextUsage { tokens: number | null; contextWindow: number; percent: number | null }

export function ContextMeter({ usage, disabled, starting, onNew }: {
  usage: ContextUsage | null; disabled: boolean; starting: boolean; onNew: () => void;
}) {
  const percent = usage?.percent;
  const known = typeof percent === 'number' && Number.isFinite(percent);
  const value = known ? Math.round(Math.max(0, Math.min(100, percent))) : 0;
  // GSD statusline thresholds: github.com/open-gsd/gsd-core/blob/main/hooks/gsd-statusline.js
  const tone = !known ? '' : value >= 80 ? 'red' : value >= 65 ? 'orange' : value >= 50 ? 'yellow' : 'green';
  const format = (tokens: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(tokens);
  const title = known && usage
    ? `${usage.tokens == null ? 'Unknown' : format(usage.tokens)} / ${format(usage.contextWindow)} tokens. Latest Pi measurement; updates after replies and compaction. Pi normally compacts older history automatically.`
    : 'Context usage is not yet available, or is awaiting a reply after compaction.';
  return <div className="context-controls">
    <div className={`context-meter ${tone}`} title={title}>
      <span>Context {known ? `${Math.round(value)}%` : '—'}</span>
      {known && <meter min={0} max={100} value={value} aria-label="Context window used" />}
    </div>
    <button className="quiet-button" disabled={disabled || starting} onClick={onNew}
      title={disabled ? 'Finish or stop Pi and clear pending messages first' : 'Start a fresh conversation; keep previous sessions saved'}>
      {starting ? 'Starting…' : 'New chat'}
    </button>
  </div>;
}
