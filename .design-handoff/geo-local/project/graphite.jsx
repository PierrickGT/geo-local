// ════════════════════════════════════════════════════════════════════
// GRAPHITE — developer tool aesthetic
// Palette: near-black ink on off-white; single electric accent
// Type: Inter UI + IBM Plex Mono for IDs/data
// Personality: precise, dense, technical
// ════════════════════════════════════════════════════════════════════

const g = {
  bg:      '#fafaf9',
  panel:   '#ffffff',
  ink:     '#18181b',
  ink2:    '#3f3f46',
  muted:   '#71717a',
  faint:   '#a1a1aa',
  line:    '#e4e4e7',
  lineSoft:'#f1f1ef',
  hover:   '#f6f6f5',
  accent:  '#2f5cff',     // electric blue
  accentBg:'#eef2ff',
  ok:      '#0ea34a',
  danger:  '#dc2626',
  dangerBg:'#fef2f2',
  font:    '"Inter", -apple-system, sans-serif',
  mono:    '"IBM Plex Mono", ui-monospace, monospace',
};

function GraphiteApp({ initial = 'entities', preselect = false, searchMode, graphMode, formFilled = false }) {
  const [page, setPage] = React.useState(initial);
  const [sel, setSel] = React.useState(preselect ? new Set(['021ccf8634a48e3891a8fa286b7683f5','0c5a42e1676b8ed381ad822580c445cf','087dd7603153830bbd4555985a73d1d8']) : new Set());
  const [query, setQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');

  return (
    <div style={{ width:'100%', height:'100%', background:g.bg, color:g.ink, fontFamily:g.font, fontSize:13, display:'flex', letterSpacing:-0.01 }}>
      <GraphiteSidebar page={page} setPage={setPage} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <GraphiteTopBar page={page} sel={sel} />
        <div style={{ flex:1, overflow:'auto', background:g.bg }}>
          {page === 'entities' && <GraphiteEntities sel={sel} setSel={setSel} query={query} setQuery={setQuery} filterType={filterType} setFilterType={setFilterType} onOpen={() => setPage('detail')} onCreate={() => setPage('create')} />}
          {page === 'detail'   && <GraphiteDetail onBack={() => setPage('entities')} onEdit={() => setPage('edit')} />}
          {page === 'search'   && <GraphiteSearch mode={searchMode} />}
          {page === 'graph'    && <GraphiteGraph mode={graphMode} />}
          {page === 'edits'    && <GraphiteEdits />}
          {page === 'create'   && <GraphiteForm mode="create" onBack={() => setPage('entities')} filled={formFilled} />}
          {page === 'edit'     && <GraphiteForm mode="edit" onBack={() => setPage('detail')} />}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────
function GraphiteSidebar({ page, setPage }) {
  const items = [
    { id:'entities', label:'Entities', count:'12,481', icon:(<path d="M2 3h10v2H2zM2 7h10v2H2zM2 11h10v2H2z" fill="currentColor"/>) },
    { id:'search',   label:'Search',                 icon:(<><circle cx="6" cy="6" r="3.5" stroke="currentColor" fill="none" strokeWidth="1.3"/><path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>) },
    { id:'graph',    label:'Graph',    count:'50',   icon:(<><circle cx="4" cy="4" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.3"/><circle cx="11" cy="11" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.3"/><path d="M5.2 5.2l4.7 4.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>) },
    { id:'edits',    label:'Edits',    count:'3',    icon:(<><path d="M2 12h10M9 3l2 2-6 6H3V9z" stroke="currentColor" fill="none" strokeWidth="1.3" strokeLinejoin="round"/></>) },
  ];
  return (
    <div style={{ width:232, background:'#fcfcfb', borderRight:`1px solid ${g.line}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'18px 16px 16px', borderBottom:`1px solid ${g.lineSoft}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:22, height:22, borderRadius:5, background:g.ink, display:'grid', placeItems:'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2h3v3H2zM7 2h3v3H7zM2 7h3v3H2zM7 7h3v3H7z" fill="#fff" opacity=".85"/><path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="#fff" strokeWidth=".8"/></svg>
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:13.5, letterSpacing:-0.2 }}>Lattice</div>
            <div style={{ fontSize:11, color:g.muted, fontFamily:g.mono }}>geo · mainnet</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'10px 10px 4px' }}>
        <div style={{ fontSize:10.5, color:g.faint, textTransform:'uppercase', letterSpacing:1, padding:'6px 8px', fontWeight:600 }}>Explore</div>
        {items.map(it => (
          <button key={it.id} onClick={() => setPage(it.id)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'7px 8px', border:'none',
              background: page === it.id ? g.hover : 'transparent',
              color: page === it.id ? g.ink : g.ink2,
              borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontSize:13, textAlign:'left',
              fontWeight: page === it.id ? 500 : 400 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: page === it.id ? g.accent : g.muted, flexShrink:0 }}>{it.icon}</svg>
            <span style={{ flex:1 }}>{it.label}</span>
            {it.count && <span style={{ fontSize:11, color:g.faint, fontFamily:g.mono, fontVariantNumeric:'tabular-nums' }}>{it.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding:'14px 10px 4px' }}>
        <div style={{ fontSize:10.5, color:g.faint, textTransform:'uppercase', letterSpacing:1, padding:'6px 8px', fontWeight:600 }}>Saved views</div>
        {['Properties only','Recent edits','Labs ≥ 5'].map(v => (
          <button key={v} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'6px 8px', border:'none',
            background:'transparent', color:g.ink2, borderRadius:6, cursor:'pointer', fontFamily:'inherit', fontSize:12.5, textAlign:'left' }}>
            <span style={{ width:6, height:6, borderRadius:1, background:g.faint }} />
            {v}
          </button>
        ))}
      </div>

      <div style={{ flex:1 }} />

      <div style={{ padding:'10px 14px', borderTop:`1px solid ${g.lineSoft}`, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:22, height:22, borderRadius:11, background:'#e4e4e7', display:'grid', placeItems:'center', fontSize:10, fontWeight:600, color:g.ink2 }}>NK</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:500 }}>noah.eth</div>
          <div style={{ fontSize:10.5, color:g.muted, fontFamily:g.mono, overflow:'hidden', textOverflow:'ellipsis' }}>0x7a…e9f2</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ color:g.faint }}><path d="M3 5l3-3 3 3M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
      </div>
    </div>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────
function GraphiteTopBar({ page, sel }) {
  const crumb = page === 'detail' ? ['Entities','Action Code'] : [titleFor(page)];
  return (
    <div style={{ height:44, borderBottom:`1px solid ${g.line}`, background:g.panel,
      display:'flex', alignItems:'center', padding:'0 16px', gap:14, flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:g.muted }}>
        {crumb.map((c,i) => (
          <React.Fragment key={i}>
            {i>0 && <span style={{ color:g.faint }}>/</span>}
            <span style={{ color: i === crumb.length-1 ? g.ink : g.muted, fontWeight: i === crumb.length-1 ? 500 : 400 }}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ flex:1 }} />
      <div style={{ display:'flex', alignItems:'center', gap:6, color:g.faint, fontFamily:g.mono, fontSize:11.5 }}>
        <span style={{ width:6, height:6, borderRadius:3, background:g.ok, boxShadow:`0 0 0 3px ${g.ok}22` }} />
        <span>synced · 2s ago</span>
      </div>
      <div style={{ width:1, height:18, background:g.line }} />
      <KbdHint k="⌘K" label="Command" />
    </div>
  );
}
function titleFor(p) { return { entities:'Entities', search:'Search', graph:'Graph', edits:'Edits', detail:'Entity', create:'New entity', edit:'Edit entity' }[p] ?? ''; }

function KbdHint({ k, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:g.muted }}>
      <span>{label}</span>
      <span style={{ fontFamily:g.mono, fontSize:11, padding:'1px 6px', border:`1px solid ${g.line}`, borderRadius:4, background:g.bg, color:g.ink2 }}>{k}</span>
    </div>
  );
}

// ─── Entities list ──────────────────────────────────────────────────
function GraphiteEntities({ sel, setSel, query, setQuery, filterType, setFilterType, onOpen, onCreate }) {
  const rows = window.ENTITIES;
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
  const filtered = rows.filter(r => filterType === 'all' ? true : r.type === filterType).filter(r => !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.id.includes(query));

  return (
    <div style={{ padding:'18px 20px 24px', maxWidth:1600, margin:'0 auto' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:14, marginBottom:14 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:600, letterSpacing:-0.5, lineHeight:1.1 }}>Entities</div>
          <div style={{ fontSize:12.5, color:g.muted, marginTop:4 }}>
            <span style={{ fontFamily:g.mono, color:g.ink2 }}>{filtered.length.toLocaleString()}</span> shown · <span style={{ fontFamily:g.mono }}>12,481</span> total
          </div>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {sel.size > 0 && (
            <>
              <div style={{ fontSize:12, color:g.ink2, padding:'0 4px' }}>
                <span style={{ fontFamily:g.mono, fontWeight:500 }}>{sel.size}</span> selected
              </div>
              <GButton variant="danger" icon={<path d="M3 4h8M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M6 7v3M8 7v3M4 4l.5 7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L10 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>}>Delete</GButton>
              <GButton icon={<path d="M7 1v6M4 4l3-3 3 3M2 9v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}>Export</GButton>
              <div style={{ width:1, height:20, background:g.line, margin:'0 2px' }} />
            </>
          )}
          <div onClick={onCreate}><GButton variant="primary" icon={<path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>}>Create entity</GButton></div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'8px 10px', background:g.panel, border:`1px solid ${g.line}`, borderRadius:8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ color:g.muted }}><circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2"/><path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by name, ID, or property…"
          style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:'inherit', fontSize:13, color:g.ink }} />
        <Chip active={filterType==='all'} onClick={()=>setFilterType('all')}>All <span style={{ color:g.faint, marginLeft:4, fontFamily:g.mono }}>12,481</span></Chip>
        <Chip active={filterType==='Entity'} onClick={()=>setFilterType('Entity')}>Entities <span style={{ color:g.faint, marginLeft:4, fontFamily:g.mono }}>8,204</span></Chip>
        <Chip active={filterType==='Property'} onClick={()=>setFilterType('Property')}>Properties <span style={{ color:g.faint, marginLeft:4, fontFamily:g.mono }}>4,277</span></Chip>
        <div style={{ width:1, height:16, background:g.line }} />
        <button style={{ border:`1px dashed ${g.line}`, background:'transparent', color:g.muted, padding:'3px 8px', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2"/></svg>
          Filter
        </button>
      </div>

      {/* Table */}
      <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
        {/* header */}
        <div style={{ display:'grid', gridTemplateColumns:'36px 1fr 340px 150px 150px 60px', alignItems:'center', padding:'8px 12px', borderBottom:`1px solid ${g.line}`, background:'#fcfcfb', fontSize:11, color:g.muted, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600 }}>
          <div><Checkbox checked={filtered.every(r => sel.has(r.id)) && filtered.length>0} indeterminate={filtered.some(r => sel.has(r.id)) && !filtered.every(r => sel.has(r.id))} onChange={() => setSel(sel.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))} /></div>
          <div>Name</div>
          <div style={{ fontFamily:g.mono, textTransform:'none', letterSpacing:0, fontSize:11.5 }}>ID</div>
          <div>Type</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, color:g.ink2 }}>Updated <SortArrow dir="desc"/></div>
          <div></div>
        </div>

        {filtered.map((r, i) => (
          <div key={r.id} onClick={() => onOpen && onOpen()}
            style={{ display:'grid', gridTemplateColumns:'36px 1fr 340px 150px 150px 60px', alignItems:'center', padding:'9px 12px',
              borderBottom: i === filtered.length-1 ? 'none' : `1px solid ${g.lineSoft}`,
              cursor:'pointer',
              background: sel.has(r.id) ? g.accentBg + '55' : 'transparent' }}
            onMouseEnter={(e)=>e.currentTarget.style.background = sel.has(r.id) ? g.accentBg + '88' : g.hover}
            onMouseLeave={(e)=>e.currentTarget.style.background = sel.has(r.id) ? g.accentBg + '55' : 'transparent'}>
            <div onClick={(e)=>{e.stopPropagation(); toggle(r.id);}}><Checkbox checked={sel.has(r.id)} /></div>
            <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
              <span style={{ width:5, height:5, borderRadius:3, background: r.type === 'Property' ? '#f59e0b' : g.accent, flexShrink:0 }} />
              <span style={{ fontWeight:500, color:g.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:g.muted, fontFamily:g.mono, fontSize:11.5 }}>
              <span>{r.id}</span>
              <button onClick={(e)=>e.stopPropagation()} style={{ border:'none', background:'transparent', color:g.faint, cursor:'pointer', padding:2, display:'flex', alignItems:'center', borderRadius:3 }}>
                <svg width="11" height="11" viewBox="0 0 11 11"><rect x="3" y="3" width="6.5" height="6.5" rx="1" stroke="currentColor" fill="none" strokeWidth="1"/><path d="M1.5 7.5V2a.5.5 0 0 1 .5-.5h5.5" stroke="currentColor" fill="none" strokeWidth="1"/></svg>
              </button>
            </div>
            <div>
              <span style={{ fontSize:11.5, color: r.type === 'Property' ? '#92400e' : g.ink2, background: r.type === 'Property' ? '#fef3c7' : g.lineSoft, padding:'2px 7px', borderRadius:3, fontWeight:500 }}>{r.type}</span>
            </div>
            <div style={{ color:g.muted, fontSize:12, fontFamily:g.mono, fontVariantNumeric:'tabular-nums' }}>{r.updated} <span style={{ color:g.faint }}>· {r.time}</span></div>
            <div style={{ textAlign:'right', color:g.faint }}>
              <svg width="13" height="13" viewBox="0 0 13 13"><path d="M5 3l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
            </div>
          </div>
        ))}

        {/* footer */}
        <div style={{ display:'flex', alignItems:'center', padding:'8px 12px', borderTop:`1px solid ${g.line}`, background:'#fcfcfb', fontSize:12, color:g.muted, fontFamily:g.mono }}>
          <span>Showing 1–{filtered.length} of 12,481</span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <PagerBtn>‹</PagerBtn>
            <span style={{ padding:'2px 8px', background:g.ink, color:'#fff', borderRadius:4 }}>1</span>
            <PagerBtn>2</PagerBtn>
            <PagerBtn>3</PagerBtn>
            <span style={{ color:g.faint }}>…</span>
            <PagerBtn>625</PagerBtn>
            <PagerBtn>›</PagerBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      border: active ? `1px solid ${g.ink}` : `1px solid ${g.line}`,
      background: active ? g.ink : g.panel,
      color: active ? '#fff' : g.ink2,
      padding:'3px 9px', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight: active ? 500 : 400,
    }}>{children}</button>
  );
}

function GButton({ children, variant, icon, small }) {
  const styles = {
    primary: { background:g.ink, color:'#fff', border:`1px solid ${g.ink}` },
    danger:  { background:g.panel, color:g.danger, border:`1px solid #fecaca` },
    default: { background:g.panel, color:g.ink, border:`1px solid ${g.line}` },
  }[variant ?? 'default'];
  return (
    <button style={{ ...styles, padding: small ? '3px 8px' : '5px 11px', borderRadius:6, fontSize:12.5, cursor:'pointer', fontFamily:'inherit', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
      {icon && <svg width="12" height="12" viewBox="0 0 14 14">{icon}</svg>}
      {children}
    </button>
  );
}

function PagerBtn({ children }) {
  return <button style={{ border:`1px solid ${g.line}`, background:g.panel, padding:'2px 7px', borderRadius:4, fontSize:12, cursor:'pointer', fontFamily:g.mono, color:g.ink2 }}>{children}</button>;
}

function Checkbox({ checked, indeterminate, onChange }) {
  return (
    <div onClick={onChange} style={{
      width:14, height:14, borderRadius:3, cursor:'pointer',
      border: checked || indeterminate ? `1px solid ${g.accent}` : `1px solid ${g.faint}`,
      background: checked || indeterminate ? g.accent : g.panel,
      display:'grid', placeItems:'center', transition:'all .12s' }}>
      {checked && <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {indeterminate && !checked && <div style={{ width:7, height:1.5, background:'#fff' }} />}
    </div>
  );
}

function SortArrow({ dir }) {
  return <svg width="9" height="9" viewBox="0 0 9 9" style={{ color:g.accent }}><path d={dir==='desc' ? 'M4.5 2v5M2.5 5.5l2 2 2-2' : 'M4.5 7V2M2.5 3.5l2-2 2 2'} stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ─── Entity detail ──────────────────────────────────────────────────
function GraphiteDetail({ onBack, onEdit }) {
  return (
    <div style={{ padding:'18px 20px 24px', maxWidth:1600, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, padding:'16px 18px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:8, background:g.accentBg, color:g.accent, display:'grid', placeItems:'center', fontSize:18, fontWeight:600, border:`1px solid ${g.accent}22`, fontFamily:g.mono }}>
            AC
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
              <span style={{ fontSize:22, fontWeight:600, letterSpacing:-0.4 }}>Action Code</span>
              <span style={{ fontSize:11.5, color:'#92400e', background:'#fef3c7', padding:'2px 7px', borderRadius:3, fontWeight:500 }}>Property</span>
              <span style={{ fontSize:11.5, color:g.ok, background:'#ecfdf5', padding:'2px 7px', borderRadius:3, fontWeight:500 }}>published</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:g.mono, fontSize:12, color:g.muted }}>
              <span>021ccf8634a48e3891a8fa286b7683f5</span>
              <button style={{ border:'none', background:'transparent', color:g.faint, cursor:'pointer', padding:0, display:'flex' }}>
                <svg width="11" height="11" viewBox="0 0 11 11"><rect x="3" y="3" width="6.5" height="6.5" rx="1" stroke="currentColor" fill="none" strokeWidth="1"/><path d="M1.5 7.5V2a.5.5 0 0 1 .5-.5h5.5" stroke="currentColor" fill="none" strokeWidth="1"/></svg>
              </button>
            </div>
            <div style={{ display:'flex', gap:22, marginTop:12, fontSize:12, color:g.muted }}>
              <div><span style={{ color:g.faint }}>Created</span> <span style={{ fontFamily:g.mono, color:g.ink2, marginLeft:4 }}>Apr 15, 2026 · 11:12 PM</span></div>
              <div><span style={{ color:g.faint }}>Updated</span> <span style={{ fontFamily:g.mono, color:g.ink2, marginLeft:4 }}>Apr 15, 2026 · 11:12 PM</span></div>
              <div><span style={{ color:g.faint }}>Data type</span> <span style={{ fontFamily:g.mono, color:g.ink2, marginLeft:4 }}>text</span></div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <GButton onClick={onBack} icon={<path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}>Back</GButton>
            <div onClick={onEdit}><GButton icon={<path d="M2 11h10M9 3l2 2-6 6H3V9z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>}>Edit</GButton></div>
            <GButton variant="danger" icon={<path d="M3 4h8M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M4 4l.5 7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L10 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>}>Delete</GButton>
          </div>
        </div>
      </div>

      {/* 2-column */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:12 }}>
        {/* left */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Tabs */}
          <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
            <div style={{ display:'flex', borderBottom:`1px solid ${g.line}`, padding:'0 12px', gap:4 }}>
              {['Properties · 2','Relations · 3','JSON','History · 1'].map((t,i) => (
                <div key={t} style={{
                  padding:'10px 12px', fontSize:13, cursor:'pointer',
                  color: i === 0 ? g.ink : g.muted,
                  fontWeight: i === 0 ? 500 : 400,
                  borderBottom: i === 0 ? `2px solid ${g.accent}` : '2px solid transparent',
                  marginBottom:-1,
                }}>{t}</div>
              ))}
            </div>
            {/* Properties */}
            <div>
              <PropertyRow k="name" type="text" v="Action Code" />
              <PropertyRow k="description" type="text" v="CMS action on this code: A=Add, C=Change, D=Delete, N=No change" multiline />
            </div>
          </div>

          {/* Relations */}
          <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${g.line}`, display:'flex', alignItems:'center' }}>
              <div style={{ fontSize:13, fontWeight:500 }}>Relations <span style={{ color:g.faint, fontWeight:400, fontFamily:g.mono }}>3</span></div>
              <div style={{ flex:1 }} />
              <button style={{ border:`1px solid ${g.line}`, background:g.panel, color:g.ink, padding:'3px 9px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2"/></svg>
                Add relation
              </button>
            </div>
            <RelationRow pred="Types"      dir="out" target="Property"       kind="Type" />
            <RelationRow pred="Data type"  dir="out" target="Text"           kind="Type" />
            <RelationRow pred="Properties" dir="in"  target="HCPCS Level II code" kind="Entity" last />
          </div>
        </div>

        {/* right rail */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Panel title="Graph neighborhood" right={<span style={{ fontSize:11, color:g.faint, fontFamily:g.mono }}>3 nodes · 3 edges</span>}>
            <div style={{ height:170, background:`radial-gradient(circle at center, ${g.lineSoft} 1px, transparent 1px) 0 0/14px 14px, ${g.bg}`, position:'relative' }}>
              {/* nodes */}
              <Node x="50%" y="50%" label="Action Code" primary />
              <Node x="15%" y="22%" label="Property" />
              <Node x="85%" y="22%" label="Text" />
              <Node x="50%" y="88%" label="HCPCS…" />
              <Edge from="50%,50%" to="15%,22%" />
              <Edge from="50%,50%" to="85%,22%" />
              <Edge from="50%,50%" to="50%,88%" />
            </div>
          </Panel>

          <Panel title="Activity">
            <ActivityItem who="noah.eth" when="2s ago" what="Updated description" />
            <ActivityItem who="system" when="14m ago" what="Synced from ipfs://Qm…" />
            <ActivityItem who="alice.eth" when="3h ago" what="Added relation → Text" last />
          </Panel>

          <Panel title="Raw" compact>
            <pre style={{ margin:0, padding:'10px 14px', fontFamily:g.mono, fontSize:11, color:g.ink2, whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.5 }}>
{`{
  "id": "021ccf86…7683f5",
  "type": "Property",
  "dataType": "text",
  "name": "Action Code"
}`}
            </pre>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, right, children, compact }) {
  return (
    <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
      <div style={{ padding: compact ? '8px 14px' : '10px 14px', borderBottom:`1px solid ${g.line}`, display:'flex', alignItems:'center' }}>
        <div style={{ fontSize:12.5, fontWeight:500, color:g.ink }}>{title}</div>
        <div style={{ flex:1 }} />
        {right}
      </div>
      {children}
    </div>
  );
}

function PropertyRow({ k, type, v, multiline }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'170px 1fr', padding:'12px 14px', borderBottom:`1px solid ${g.lineSoft}`, alignItems: multiline ? 'flex-start' : 'center', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:g.mono, fontSize:12.5, color:g.ink }}>{k}</span>
        <span style={{ fontSize:10.5, color:g.muted, background:g.lineSoft, padding:'1px 5px', borderRadius:3, fontFamily:g.mono, letterSpacing:0.2 }}>{type}</span>
      </div>
      <div style={{ fontSize:13, color:g.ink2, lineHeight:1.5 }}>{v}</div>
    </div>
  );
}

function RelationRow({ pred, dir, target, kind, last }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'170px auto 1fr auto', padding:'11px 14px', borderBottom: last ? 'none' : `1px solid ${g.lineSoft}`, alignItems:'center', gap:12 }}>
      <span style={{ fontFamily:g.mono, fontSize:12.5, color:g.ink2 }}>{pred}</span>
      <svg width="18" height="10" viewBox="0 0 18 10" style={{ color:g.faint }}>
        {dir === 'out' ? <><path d="M1 5h14" stroke="currentColor" strokeWidth="1.2"/><path d="M13 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></> : <><path d="M3 5h14" stroke="currentColor" strokeWidth="1.2"/><path d="M5 2L2 5l3 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>}
      </svg>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:5, height:5, borderRadius:3, background: kind==='Type' ? '#8b5cf6' : g.accent }} />
        <span style={{ color:g.accent, fontWeight:500, fontSize:13, cursor:'pointer' }}>{target}</span>
        <span style={{ fontSize:10.5, color:g.muted, background:g.lineSoft, padding:'1px 6px', borderRadius:3, fontFamily:g.mono }}>{kind}</span>
      </div>
      <button style={{ border:'none', background:'transparent', color:g.faint, cursor:'pointer', padding:2 }}>
        <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="3" cy="6.5" r="1" fill="currentColor"/><circle cx="6.5" cy="6.5" r="1" fill="currentColor"/><circle cx="10" cy="6.5" r="1" fill="currentColor"/></svg>
      </button>
    </div>
  );
}

function Node({ x, y, label, primary }) {
  return (
    <div style={{ position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)',
      padding:'4px 9px', borderRadius:12, fontSize:10.5, whiteSpace:'nowrap',
      background: primary ? g.accent : g.panel, color: primary ? '#fff' : g.ink2,
      border: primary ? 'none' : `1px solid ${g.line}`,
      boxShadow: primary ? '0 2px 8px rgba(47,92,255,.3)' : '0 1px 2px rgba(0,0,0,.04)',
      fontWeight: primary ? 500 : 400, zIndex:2 }}>{label}</div>
  );
}

function Edge({ from, to }) {
  const [fx,fy] = from.split(','), [tx,ty] = to.split(',');
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={g.faint} strokeWidth="1" strokeDasharray="2,3"/>
    </svg>
  );
}

function ActivityItem({ who, when, what, last }) {
  return (
    <div style={{ padding:'10px 14px', borderBottom: last ? 'none' : `1px solid ${g.lineSoft}`, display:'flex', gap:10, alignItems:'flex-start' }}>
      <div style={{ width:6, height:6, borderRadius:3, background:g.accent, marginTop:6, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, color:g.ink }}>{what}</div>
        <div style={{ fontSize:11, color:g.muted, marginTop:2 }}>
          <span style={{ fontFamily:g.mono, color:g.ink2 }}>{who}</span> · <span>{when}</span>
        </div>
      </div>
    </div>
  );
}

function GraphiteEmpty({ label, hint }) {
  return (
    <div style={{ padding:'18px 20px', maxWidth:1600, margin:'0 auto' }}>
      <div style={{ fontSize:22, fontWeight:600, letterSpacing:-0.5, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:13, color:g.muted, marginBottom:18 }}>{hint}</div>
      <div style={{ background:g.panel, border:`1px dashed ${g.line}`, borderRadius:8, padding:60, textAlign:'center', color:g.muted, fontSize:13 }}>
        {label} surface — stub for this exploration
      </div>
    </div>
  );
}

// ─── Search ─────────────────────────────────────────────────────────
function GraphiteSearch({ mode }) {
  const [q, setQ] = React.useState(mode === 'name' ? 'Action' : mode === 'id' ? '021ccf8634a48e3891a8fa286b7683f5' : '');
  const isId = /^[0-9a-f]{6,}$/i.test(q.trim());
  const isName = q.trim().length > 0 && !isId;

  const nameMatches = [
    { eid:'021ccf8634a48e3891a8fa286b7683f5', ename:'Action Code',         pid:'a126ca530c8e…', val:'Action Code',                                         kind:'name' },
    { eid:'021ccf8634a48e3891a8fa286b7683f5', ename:'Action Code',         pid:'9b1f76ff9711…', val:'CMS action on this code: A=Add, C=Change, D=Delete, N=No change', kind:'description' },
    { eid:'d41a087b2ad683bebadb323f9b40e901', ename:'Action Effective Date', pid:'a126ca530c8e…', val:'Action Effective Date',                              kind:'name' },
    { eid:'d41a087b2ad683bebadb323f9b40e901', ename:'Action Effective Date', pid:'9b1f76ff9711…', val:'Date the current CMS action (add/change/delete) takes effect', kind:'description' },
  ];

  return (
    <div style={{ padding:'18px 20px 24px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:22, fontWeight:600, letterSpacing:-0.5 }}>Search</div>
        <div style={{ fontSize:12.5, color:g.muted, marginTop:4 }}>Query across names, IDs, and property values</div>
      </div>

      {/* Big search bar */}
      <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <svg width="16" height="16" viewBox="0 0 14 14" style={{ color:g.muted }}><circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2"/><path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        <input value={q} onChange={(e)=>setQ(e.target.value)} autoFocus placeholder="Search by name, property value, or paste a 32-char id…"
          style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:isId ? g.mono : 'inherit', fontSize:14, color:g.ink }} />
        {q && (
          <button onClick={()=>setQ('')} style={{ border:'none', background:g.lineSoft, color:g.muted, width:20, height:20, borderRadius:10, cursor:'pointer', display:'grid', placeItems:'center' }}>
            <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </button>
        )}
        <span style={{ fontFamily:g.mono, fontSize:11, color:g.faint, padding:'2px 6px', border:`1px solid ${g.line}`, borderRadius:4 }}>⌘K</span>
      </div>

      {/* scope chips */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        <Chip active>All scopes</Chip>
        <Chip>Names</Chip>
        <Chip>Descriptions</Chip>
        <Chip>Property values</Chip>
        <Chip>IDs</Chip>
      </div>

      {/* Empty */}
      {!q && (
        <div style={{ background:g.panel, border:`1px dashed ${g.line}`, borderRadius:8, padding:'44px 20px', textAlign:'center' }}>
          <div style={{ width:36, height:36, borderRadius:18, background:g.lineSoft, margin:'0 auto 10px', display:'grid', placeItems:'center' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" style={{ color:g.muted }}><circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2"/><path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize:14, fontWeight:500 }}>Find entities across the graph</div>
          <div style={{ fontSize:12.5, color:g.muted, marginTop:4, marginBottom:18 }}>Enter a name, a property value, or paste a full 32-character id.</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            {['Action Code','Lab Certification','URL','021ccf86…'].map(s => (
              <button key={s} onClick={()=>setQ(s.replace('…',''))} style={{ border:`1px solid ${g.line}`, background:g.bg, padding:'5px 10px', borderRadius:6, fontSize:12, color:g.ink2, cursor:'pointer', fontFamily: s.startsWith('021') ? g.mono : 'inherit' }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Results — by ID */}
      {isId && (
        <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', borderBottom:`1px solid ${g.line}`, background:'#fcfcfb', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12.5, fontWeight:500 }}>Matching entities</span>
            <span style={{ fontFamily:g.mono, fontSize:11.5, color:g.muted }}>1</span>
          </div>
          <div style={{ padding:'12px 14px', display:'grid', gridTemplateColumns:'340px 1fr auto', gap:16, alignItems:'center' }}>
            <span style={{ fontFamily:g.mono, fontSize:12, color:g.ink2 }}>{q}</span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:5, height:5, borderRadius:3, background:'#f59e0b' }} />
              <span style={{ fontWeight:500 }}>Action Code</span>
              <span style={{ fontSize:11, color:'#92400e', background:'#fef3c7', padding:'1px 6px', borderRadius:3 }}>Property</span>
            </div>
            <button style={{ border:`1px solid ${g.line}`, background:g.panel, padding:'3px 10px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Open →</button>
          </div>
        </div>
      )}

      {/* Results — by name */}
      {isName && (
        <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', borderBottom:`1px solid ${g.line}`, background:'#fcfcfb', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12.5, fontWeight:500 }}>Text matches</span>
            <span style={{ fontFamily:g.mono, fontSize:11.5, color:g.muted }}>{nameMatches.length}</span>
            <div style={{ flex:1 }} />
            <span style={{ fontSize:11.5, color:g.muted }}>Grouped by entity</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'240px 180px 1fr 80px', padding:'8px 14px', borderBottom:`1px solid ${g.line}`, fontSize:11, color:g.muted, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600 }}>
            <div>Entity</div>
            <div>Property</div>
            <div>Value</div>
            <div></div>
          </div>
          {nameMatches.map((m, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'240px 180px 1fr 80px', padding:'10px 14px', alignItems:'center', borderBottom: i === nameMatches.length-1 ? 'none' : `1px solid ${g.lineSoft}`, gap:10 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:g.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.ename}</div>
                <div style={{ fontFamily:g.mono, fontSize:11, color:g.faint, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.eid.slice(0,16)}…</div>
              </div>
              <div>
                <div style={{ fontFamily:g.mono, fontSize:11.5, color:g.ink2 }}>{m.pid}</div>
                <div style={{ fontSize:10.5, color:g.muted, marginTop:2 }}>{m.kind}</div>
              </div>
              <div style={{ fontSize:13, color:g.ink2, lineHeight:1.4 }} dangerouslySetInnerHTML={{ __html: highlightMatch(m.val, q) }} />
              <div style={{ textAlign:'right' }}>
                <button style={{ border:`1px solid ${g.line}`, background:g.panel, padding:'3px 9px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:'inherit', color:g.ink2 }}>Open</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function highlightMatch(text, q) {
  if (!q) return text;
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'ig');
  return text.replace(re, '<mark style="background:#fef08a;color:#713f12;padding:0 2px;border-radius:2px">$1</mark>');
}

// ─── Graph ──────────────────────────────────────────────────────────
function GraphiteGraph({ mode }) {
  const expanded = mode === 'expanded' || mode === 'relations';
  const [selected, setSelected] = React.useState(mode === 'relations' ? 'action-code' : null);

  // Deterministic node layout
  const nodes = [
    { id:'action-code', x:50, y:50, label:'Action Code', kind:'Property', primary:true },
    { id:'property',    x:22, y:22, label:'Property', kind:'Type' },
    { id:'text',        x:78, y:22, label:'Text', kind:'Type' },
    { id:'hcpcs',       x:50, y:82, label:'HCPCS Level II code', kind:'Entity' },
    { id:'ascg',        x:15, y:60, label:'ASC Payment Group', kind:'Property' },
    { id:'dateadded',   x:85, y:60, label:'Date Added', kind:'Property' },
    { id:'lab1',        x:30, y:88, label:'Lab Certification 1', kind:'Entity' },
    { id:'lab2',        x:70, y:88, label:'Lab Certification 2', kind:'Entity' },
    { id:'a1',          x:10, y:35, label:'A1', kind:'Property' },
    { id:'opps',        x:90, y:35, label:'OPPS Pricing', kind:'Property' },
    { id:'asc2',        x:38, y:10, label:'ASC Payment 2', kind:'Property' },
    { id:'cim',         x:62, y:10, label:'CIM Reference 1', kind:'Entity' },
  ];
  const edges = [
    ['action-code','property'],['action-code','text'],['action-code','hcpcs'],
    ['hcpcs','lab1'],['hcpcs','lab2'],['hcpcs','ascg'],['hcpcs','dateadded'],
    ['property','a1'],['property','opps'],['property','ascg'],['property','dateadded'],
    ['cim','hcpcs'],['asc2','property'],
  ];
  const sel = nodes.find(n => n.id === selected);
  const related = new Set();
  if (selected) edges.forEach(([a,b])=>{ if (a===selected) related.add(b); if (b===selected) related.add(a); });

  return (
    <div style={{ padding:'14px 16px 16px', maxWidth:1600, margin:'0 auto', display:'grid', gridTemplateColumns:`1fr ${sel ? '340px' : '0px'}`, gap:12, height:'calc(100% - 30px)' }}>
      {/* main canvas */}
      <div style={{ position:'relative', background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden',
        backgroundImage:`radial-gradient(circle at center, ${g.lineSoft} 1px, transparent 1px)`, backgroundSize:'16px 16px' }}>
        {/* header overlay */}
        <div style={{ position:'absolute', top:12, left:12, right:12, display:'flex', alignItems:'center', gap:10, zIndex:5 }}>
          <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Graph</div>
            <span style={{ fontFamily:g.mono, fontSize:11, color:g.muted }}>{nodes.length} nodes · {edges.length} edges</span>
          </div>
          <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, padding:'4px', display:'flex', gap:2 }}>
            <GraphChip active>2D</GraphChip>
            <GraphChip>Force</GraphChip>
            <GraphChip>Hierarchy</GraphChip>
          </div>
          <div style={{ flex:1 }} />
          <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, padding:'4px 8px', display:'flex', alignItems:'center', gap:6 }}>
            <svg width="12" height="12" viewBox="0 0 14 14" style={{ color:g.muted }}><circle cx="6" cy="6" r="3.8" stroke="currentColor" fill="none" strokeWidth="1.2"/><path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input placeholder="Focus node…" style={{ border:'none', outline:'none', background:'transparent', fontSize:12, width:120 }} />
          </div>
        </div>

        {/* legend */}
        <div style={{ position:'absolute', top:62, left:12, background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, padding:'8px 10px', zIndex:5, fontSize:11.5 }}>
          <div style={{ color:g.muted, fontSize:10, textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:6 }}>Legend</div>
          <LegendRow color={g.accent} label="Entity" />
          <LegendRow color="#f59e0b" label="Property" />
          <LegendRow color="#8b5cf6" label="Type" />
        </div>

        {/* zoom controls */}
        <div style={{ position:'absolute', bottom:14, left:14, display:'flex', flexDirection:'column', gap:4, zIndex:5 }}>
          <ZoomBtn>+</ZoomBtn>
          <ZoomBtn>−</ZoomBtn>
          <ZoomBtn><svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 4V2h2M8 2h2v2M10 8v2H8M4 10H2V8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg></ZoomBtn>
          <ZoomBtn><svg width="11" height="11" viewBox="0 0 12 12"><path d="M4 6V3a2 2 0 0 1 4 0v3M3 6h6v4H3z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/></svg></ZoomBtn>
        </div>

        {/* Edges */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          {edges.map(([a,b], i) => {
            const na = nodes.find(n=>n.id===a), nb = nodes.find(n=>n.id===b);
            if (!na || !nb) return null;
            const active = selected && (a === selected || b === selected);
            return (
              <line key={i} x1={na.x+'%'} y1={na.y+'%'} x2={nb.x+'%'} y2={nb.y+'%'}
                stroke={active ? g.accent : (selected ? g.lineSoft : g.line)}
                strokeWidth={active ? 1.6 : 1} />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(n => {
          const dim = selected && n.id !== selected && !related.has(n.id);
          const isSel = n.id === selected;
          const color = n.kind === 'Property' ? '#f59e0b' : n.kind === 'Type' ? '#8b5cf6' : g.accent;
          return (
            <div key={n.id} onClick={()=>setSelected(n.id === selected ? null : n.id)}
              style={{ position:'absolute', left:n.x+'%', top:n.y+'%', transform:'translate(-50%,-50%)',
                padding:'4px 10px', borderRadius:12, fontSize:11.5, whiteSpace:'nowrap', cursor:'pointer',
                background: isSel ? g.accent : g.panel, color: isSel ? '#fff' : g.ink2,
                border: isSel ? 'none' : `1px solid ${g.line}`,
                boxShadow: isSel ? '0 4px 14px rgba(47,92,255,.35)' : '0 1px 2px rgba(0,0,0,.04)',
                fontWeight: isSel ? 600 : 500,
                opacity: dim ? 0.35 : 1, transition:'opacity .15s', zIndex: isSel ? 3 : 2,
                display:'flex', alignItems:'center', gap:6 }}>
              {!isSel && <span style={{ width:5, height:5, borderRadius:3, background:color, flexShrink:0 }} />}
              {n.label}
            </div>
          );
        })}
      </div>

      {/* Inspector */}
      {sel && (
        <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${g.line}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ width:7, height:7, borderRadius:4, background: sel.kind === 'Property' ? '#f59e0b' : sel.kind === 'Type' ? '#8b5cf6' : g.accent }} />
              <span style={{ fontSize:10.5, color:g.muted, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>{sel.kind}</span>
              <div style={{ flex:1 }} />
              <button onClick={()=>setSelected(null)} style={{ border:'none', background:'transparent', color:g.faint, cursor:'pointer', width:18, height:18, borderRadius:9, display:'grid', placeItems:'center' }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ fontSize:17, fontWeight:600, letterSpacing:-0.3 }}>{sel.label}</div>
            <div style={{ fontFamily:g.mono, fontSize:11, color:g.muted, marginTop:3 }}>021ccf86…7683f5</div>
            <div style={{ display:'flex', gap:6, marginTop:12 }}>
              <GButton small icon={<path d="M7 3l4 4-4 4M3 7h8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>}>Open</GButton>
              <GButton small icon={<><circle cx="4" cy="4" r="1.4" stroke="currentColor" fill="none" strokeWidth="1.2"/><circle cx="10" cy="10" r="1.4" stroke="currentColor" fill="none" strokeWidth="1.2"/><path d="M5 5l4 4" stroke="currentColor" strokeWidth="1.2"/></>}>Expand</GButton>
              <GButton small>Pin</GButton>
            </div>
          </div>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${g.line}` }}>
            <div style={{ fontSize:10.5, color:g.muted, textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:8 }}>Neighbors · {related.size}</div>
            {[...related].slice(0,6).map(rid => {
              const r = nodes.find(n=>n.id===rid);
              return (
                <div key={rid} onClick={()=>setSelected(rid)} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', cursor:'pointer' }}>
                  <span style={{ width:5, height:5, borderRadius:3, background: r.kind === 'Property' ? '#f59e0b' : r.kind === 'Type' ? '#8b5cf6' : g.accent }} />
                  <span style={{ fontSize:12.5, color:g.ink2, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.label}</span>
                  <span style={{ fontSize:10.5, color:g.faint }}>{r.kind.toLowerCase()}</span>
                </div>
              );
            })}
          </div>
          <div style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:10.5, color:g.muted, textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:8 }}>Degree</div>
            <div style={{ display:'flex', gap:14, fontSize:12.5 }}>
              <div><span style={{ color:g.muted }}>In </span><span style={{ fontFamily:g.mono, fontWeight:500 }}>1</span></div>
              <div><span style={{ color:g.muted }}>Out </span><span style={{ fontFamily:g.mono, fontWeight:500 }}>2</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GraphChip({ active, children }) {
  return <button style={{ border:'none', background: active ? g.ink : 'transparent', color: active ? '#fff' : g.ink2, padding:'3px 9px', borderRadius:5, fontSize:11.5, cursor:'pointer', fontFamily:'inherit', fontWeight: active ? 500 : 400 }}>{children}</button>;
}
function LegendRow({ color, label }) {
  return <div style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0' }}><span style={{ width:6, height:6, borderRadius:3, background:color }} /><span style={{ color:g.ink2 }}>{label}</span></div>;
}
function ZoomBtn({ children }) {
  return <button style={{ width:26, height:26, border:`1px solid ${g.line}`, background:g.panel, color:g.ink2, borderRadius:5, cursor:'pointer', display:'grid', placeItems:'center', fontSize:14, fontFamily:g.mono }}>{children}</button>;
}

// ─── Edits ──────────────────────────────────────────────────────────
function GraphiteEdits() {
  const edits = [
    { id:1, type:'update', target:'Action Code',          field:'description', before:'CMS action on this code: A=Add, C=Change, D=Delete', after:'CMS action on this code: A=Add, C=Change, D=Delete, N=No change', author:'noah.eth', when:'2s ago' },
    { id:2, type:'create', target:'Lab Certification 8',  field:null,          author:'noah.eth', when:'4m ago' },
    { id:3, type:'relation', target:'HCPCS Level II code', rel:'→ Action Code', author:'alice.eth', when:'14m ago' },
  ];
  return (
    <div style={{ padding:'18px 20px 24px', maxWidth:1400, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-end', marginBottom:16, gap:14 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:600, letterSpacing:-0.5 }}>Edits</div>
          <div style={{ fontSize:12.5, color:g.muted, marginTop:4 }}>
            <span style={{ fontFamily:g.mono, color:g.ink2 }}>3</span> pending · <span style={{ fontFamily:g.mono, color:g.ink2 }}>1</span> in flight · <span style={{ fontFamily:g.mono, color:g.ink2 }}>248</span> published
          </div>
        </div>
        <div style={{ flex:1 }} />
        <GButton icon={<path d="M3 6h8M3 10h8M3 2h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>}>Diff</GButton>
        <GButton>Discard all</GButton>
        <GButton variant="primary" icon={<path d="M7 1v7M4 5l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}>Publish 3 changes</GButton>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${g.line}`, marginBottom:12, gap:0 }}>
        {['Pending · 3','History · 248','Conflicts · 0'].map((t,i) => (
          <div key={t} style={{ padding:'10px 14px', fontSize:13, cursor:'pointer', color: i===0 ? g.ink : g.muted, fontWeight: i===0 ? 500 : 400, borderBottom: i===0 ? `2px solid ${g.accent}` : '2px solid transparent', marginBottom:-1 }}>{t}</div>
        ))}
      </div>

      {/* Edit list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {edits.map(e => <EditCard key={e.id} e={e} />)}
      </div>
    </div>
  );
}

function EditCard({ e }) {
  const badge = e.type === 'create' ? { label:'CREATE', fg:g.ok, bg:'#ecfdf5' }
              : e.type === 'update' ? { label:'UPDATE', fg:g.accent, bg:g.accentBg }
              : { label:'RELATION', fg:'#7c3aed', bg:'#f3e8ff' };
  return (
    <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${g.lineSoft}`, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontFamily:g.mono, fontSize:10.5, color:badge.fg, background:badge.bg, padding:'2px 7px', borderRadius:3, fontWeight:600, letterSpacing:0.5 }}>{badge.label}</span>
        <span style={{ fontWeight:500, fontSize:13.5 }}>{e.target}</span>
        {e.field && <span style={{ fontFamily:g.mono, fontSize:11.5, color:g.muted }}>· {e.field}</span>}
        {e.rel && <span style={{ fontFamily:g.mono, fontSize:11.5, color:g.muted }}>· {e.rel}</span>}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11.5, color:g.muted }}><span style={{ fontFamily:g.mono, color:g.ink2 }}>{e.author}</span> · {e.when}</span>
        <button style={{ border:`1px solid ${g.line}`, background:g.panel, padding:'2px 8px', borderRadius:5, fontSize:11.5, cursor:'pointer', fontFamily:'inherit' }}>Revert</button>
      </div>
      {e.before && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:g.mono, fontSize:12 }}>
          <div style={{ padding:'10px 14px', background:'#fef2f2', color:'#991b1b', borderRight:`1px solid ${g.lineSoft}` }}>
            <div style={{ fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'#b91c1c', fontWeight:600, marginBottom:4 }}>− Before</div>
            <div style={{ lineHeight:1.5 }}>{e.before}</div>
          </div>
          <div style={{ padding:'10px 14px', background:'#ecfdf5', color:'#065f46' }}>
            <div style={{ fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'#047857', fontWeight:600, marginBottom:4 }}>+ After</div>
            <div style={{ lineHeight:1.5 }}>{e.after}</div>
          </div>
        </div>
      )}
      {e.type === 'create' && (
        <div style={{ padding:'12px 14px', fontSize:12.5, color:g.muted, background:'#fafafa' }}>New entity to be inserted with 0 properties, 0 relations</div>
      )}
      {e.type === 'relation' && (
        <div style={{ padding:'12px 14px', fontSize:12.5, color:g.ink2, background:'#fafafa', fontFamily:g.mono }}>+ Add <span style={{ color:g.accent }}>HCPCS Level II code</span> —[has property]→ <span style={{ color:g.accent }}>Action Code</span></div>
      )}
    </div>
  );
}

// ─── Create / Edit form ─────────────────────────────────────────────
function GraphiteForm({ mode, onBack, filled }) {
  const isEdit = mode === 'edit';
  const [name, setName] = React.useState(isEdit ? 'Action Code' : (filled ? 'My New Entity' : ''));
  const [desc, setDesc] = React.useState(isEdit ? 'CMS action on this code: A=Add, C=Change, D=Delete, N=No change' : (filled ? 'A description for the entity' : ''));
  const [types, setTypes] = React.useState(isEdit ? '' : (filled ? 'Type' : ''));
  const [props, setProps] = React.useState(filled ? [{ pid:'', dtype:'text', val:'' }] : []);
  const addProp = () => setProps([...props, { pid:'', dtype:'text', val:'' }]);
  const removeProp = (i) => setProps(props.filter((_,idx)=>idx!==i));

  return (
    <div style={{ padding:'18px 20px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:g.muted, marginBottom:12 }}>
        <button onClick={onBack} style={{ border:'none', background:'transparent', color:g.muted, cursor:'pointer', fontFamily:'inherit', padding:0, fontSize:12.5 }}>{isEdit ? 'Action Code' : 'Entities'}</button>
        <span style={{ color:g.faint }}>/</span>
        <span style={{ color:g.ink, fontWeight:500 }}>{isEdit ? 'Edit' : 'New'}</span>
      </div>

      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:22, fontWeight:600, letterSpacing:-0.5 }}>{isEdit ? 'Edit entity' : 'Create entity'}</div>
        <div style={{ fontSize:12.5, color:g.muted, marginTop:4 }}>{isEdit ? 'Changes will be staged as edits until published' : 'New entity will be staged as a pending edit'}</div>
      </div>

      <div style={{ background:g.panel, border:`1px solid ${g.line}`, borderRadius:8, overflow:'hidden' }}>
        {/* Identity section */}
        <FormSection title="Identity" subtitle="How this entity is named and identified">
          <Field label="Name" required>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Anesthesia Base Units"
              style={formInput} />
          </Field>
          <Field label="Description" hint="Markdown supported · plain text by default">
            <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} rows={3} placeholder="Optional description"
              style={{ ...formInput, fontFamily:'inherit', resize:'vertical', padding:'8px 10px', lineHeight:1.5 }} />
          </Field>
          {isEdit && (
            <Field label="ID">
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:g.bg, border:`1px solid ${g.line}`, borderRadius:6 }}>
                <span style={{ fontFamily:g.mono, fontSize:12, color:g.muted, flex:1, overflow:'hidden', textOverflow:'ellipsis' }}>021ccf8634a48e3891a8fa286b7683f5</span>
                <span style={{ fontSize:11, color:g.faint }}>generated · immutable</span>
              </div>
            </Field>
          )}
        </FormSection>

        {/* Types */}
        <FormSection title="Types" subtitle="Which type entities classify this one">
          <Field label="Types">
            <input value={types} onChange={(e)=>setTypes(e.target.value)} placeholder="Type, Property (comma-separated)"
              style={formInput} />
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              {types && types.split(',').map(t=>t.trim()).filter(Boolean).map(t => (
                <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 6px 3px 9px', background:g.accentBg, color:g.accent, fontSize:11.5, borderRadius:4, fontWeight:500 }}>
                  {t}
                  <button style={{ border:'none', background:'transparent', color:g.accent, cursor:'pointer', padding:0, display:'grid', placeItems:'center', width:14, height:14, borderRadius:7 }}>×</button>
                </span>
              ))}
              <button style={{ border:`1px dashed ${g.line}`, background:'transparent', color:g.muted, padding:'2px 8px', borderRadius:4, fontSize:11.5, cursor:'pointer' }}>+ Suggest</button>
            </div>
          </Field>
        </FormSection>

        {/* Properties */}
        <FormSection title="Properties" subtitle="Typed key-value pairs attached to this entity">
          {props.length === 0 && (
            <div style={{ padding:'14px', border:`1px dashed ${g.line}`, borderRadius:6, fontSize:12.5, color:g.muted, textAlign:'center' }}>No properties yet. Add one to define data on this entity.</div>
          )}
          {props.map((pr, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1.2fr 110px 1.6fr 32px', gap:8, marginBottom:8, alignItems:'center' }}>
              <input value={pr.pid} onChange={(e)=>{ const n=[...props]; n[i]={...n[i],pid:e.target.value}; setProps(n); }} placeholder="Property ID or name" style={{ ...formInput, fontFamily:g.mono, fontSize:12 }} />
              <select value={pr.dtype} onChange={(e)=>{ const n=[...props]; n[i]={...n[i],dtype:e.target.value}; setProps(n); }} style={formInput}>
                <option value="text">text</option>
                <option value="number">number</option>
                <option value="date">date</option>
                <option value="boolean">boolean</option>
                <option value="url">url</option>
              </select>
              <input value={pr.val} onChange={(e)=>{ const n=[...props]; n[i]={...n[i],val:e.target.value}; setProps(n); }} placeholder="Value" style={formInput} />
              <button onClick={()=>removeProp(i)} style={{ width:28, height:28, border:`1px solid ${g.line}`, background:g.panel, color:g.muted, borderRadius:6, cursor:'pointer', display:'grid', placeItems:'center' }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
          <button onClick={addProp} style={{ border:`1px dashed ${g.line}`, background:'transparent', color:g.ink2, padding:'6px 12px', borderRadius:6, fontSize:12.5, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.3"/></svg>
            Add property
          </button>
        </FormSection>
      </div>

      {/* Staged preview + actions */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, padding:'10px 14px', background:g.panel, border:`1px solid ${g.line}`, borderRadius:8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: isEdit && !name ? g.faint : g.accent }}>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" fill="none" strokeWidth="1.2"/>
          <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize:12.5, color:g.ink2 }}>
          {isEdit ? 'No changes to save.' : (name ? <>Will stage <span style={{ fontWeight:500 }}>1 create</span> to the Edits queue</> : 'Nothing staged yet')}
        </span>
        <div style={{ flex:1 }} />
        <button onClick={onBack} style={{ border:`1px solid ${g.line}`, background:g.panel, padding:'6px 14px', borderRadius:6, fontSize:12.5, cursor:'pointer', fontFamily:'inherit', color:g.ink2 }}>Cancel</button>
        <button disabled={isEdit && !name} style={{
          border:'none', padding:'6px 14px', borderRadius:6, fontSize:12.5, cursor: (isEdit && !name) ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontWeight:500,
          background: (isEdit && !name) ? g.lineSoft : g.ink,
          color: (isEdit && !name) ? g.faint : '#fff',
        }}>{isEdit ? 'Save changes' : 'Create entity'}</button>
      </div>
    </div>
  );
}

const formInput = {
  width:'100%', padding:'6px 10px', border:`1px solid ${g.line}`, borderRadius:6, fontSize:13, fontFamily:'inherit', background:g.panel, color:g.ink, outline:'none',
};

function FormSection({ title, subtitle, children }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24, padding:'18px 18px', borderBottom:`1px solid ${g.lineSoft}` }}>
      <div>
        <div style={{ fontSize:13.5, fontWeight:500, color:g.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:g.muted, marginTop:3, lineHeight:1.4 }}>{subtitle}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:6 }}>
        <label style={{ fontSize:12, fontWeight:500, color:g.ink2 }}>{label}{required && <span style={{ color:g.danger, marginLeft:2 }}>*</span>}</label>
        {hint && <span style={{ fontSize:11, color:g.faint }}>· {hint}</span>}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { GraphiteApp });
