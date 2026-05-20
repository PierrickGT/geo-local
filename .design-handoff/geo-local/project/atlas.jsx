// ════════════════════════════════════════════════════════════════════
// ATLAS — editorial data-explorer aesthetic
// Palette: warm paper, cream, ink; ochre accent
// Type: Fraunces serif headings + Inter body + IBM Plex Mono for IDs
// Personality: calm, readable, editorial
// ════════════════════════════════════════════════════════════════════

const a = {
  bg:      '#f6f2ea',
  paper:   '#fdfbf6',
  ink:     '#1c1a16',
  ink2:    '#44403a',
  muted:   '#7a7468',
  faint:   '#b4ac9c',
  line:    '#e7e0d1',
  lineSoft:'#efe9da',
  hover:   '#f1ece0',
  accent:  '#9a5a1f',     // warm ochre
  accentBg:'#f5ead6',
  ok:      '#5a7a3a',
  danger:  '#a63125',
  serif:   '"Fraunces", Georgia, serif',
  sans:    '"Inter", -apple-system, sans-serif',
  mono:    '"IBM Plex Mono", ui-monospace, monospace',
};

function AtlasApp({ initial = 'entities', preselect = false }) {
  const [page, setPage] = React.useState(initial);
  const [sel, setSel] = React.useState(preselect ? new Set(['021ccf8634a48e3891a8fa286b7683f5','0c5a42e1676b8ed381ad822580c445cf','087dd7603153830bbd4555985a73d1d8']) : new Set());
  const [filterType, setFilterType] = React.useState('all');

  return (
    <div style={{ width:'100%', height:'100%', background:a.bg, color:a.ink, fontFamily:a.sans, fontSize:13.5, display:'flex' }}>
      <AtlasSidebar page={page} setPage={setPage} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{ flex:1, overflow:'auto' }}>
          {page === 'entities' && <AtlasEntities sel={sel} setSel={setSel} filterType={filterType} setFilterType={setFilterType} onOpen={() => setPage('detail')} />}
          {page === 'detail' && <AtlasDetail onBack={() => setPage('entities')} />}
          {page === 'search' && <AtlasEmpty label="Search" hint="Query the graph by name, identifier, or property value." />}
          {page === 'graph' && <AtlasEmpty label="Graph" hint="Visualize entity neighborhoods." />}
          {page === 'edits' && <AtlasEmpty label="Edits" hint="Pending changes awaiting publication." />}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────
function AtlasSidebar({ page, setPage }) {
  const items = [
    { id:'entities', label:'Entities', count:'12,481' },
    { id:'search',   label:'Search' },
    { id:'graph',    label:'Graph',    count:'50' },
    { id:'edits',    label:'Edits',    count:'3' },
  ];
  return (
    <div style={{ width:240, background:a.bg, borderRight:`1px solid ${a.line}`, display:'flex', flexDirection:'column', flexShrink:0, padding:'24px 20px' }}>
      {/* Brand */}
      <div style={{ marginBottom:36 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ color:a.accent }}>
            <circle cx="11" cy="11" r="9" stroke="currentColor" fill="none" strokeWidth="1.2"/>
            <path d="M3 11h16M11 2.5a14 14 0 0 1 0 17M11 2.5a14 14 0 0 0 0 17" stroke="currentColor" fill="none" strokeWidth="1"/>
          </svg>
          <div>
            <div style={{ fontFamily:a.serif, fontSize:21, fontWeight:500, letterSpacing:-0.4, color:a.ink, lineHeight:1 }}>Atlas</div>
            <div style={{ fontSize:10.5, color:a.muted, letterSpacing:2, textTransform:'uppercase', marginTop:3 }}>for Geo</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => setPage(it.id)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:'none',
              background: page === it.id ? a.paper : 'transparent',
              color: page === it.id ? a.ink : a.ink2,
              borderLeft: page === it.id ? `2px solid ${a.accent}` : '2px solid transparent',
              borderRadius:0, cursor:'pointer', fontFamily:'inherit', fontSize:14, textAlign:'left',
              fontWeight: page === it.id ? 500 : 400 }}>
            <span style={{ flex:1 }}>{it.label}</span>
            {it.count && <span style={{ fontSize:11.5, color:a.muted, fontFamily:a.mono, fontVariantNumeric:'tabular-nums' }}>{it.count}</span>}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height:1, background:a.line, margin:'28px 0 18px' }} />

      <div style={{ fontSize:10.5, color:a.muted, textTransform:'uppercase', letterSpacing:1.5, fontWeight:600, marginBottom:8, padding:'0 12px' }}>Space</div>
      <div style={{ padding:'10px 12px', background:a.paper, border:`1px solid ${a.line}`, borderRadius:4 }}>
        <div style={{ fontSize:13, fontWeight:500, color:a.ink }}>Healthcare codes</div>
        <div style={{ fontSize:11.5, color:a.muted, marginTop:2 }}>CMS · HCPCS · 2026</div>
      </div>

      <div style={{ flex:1 }} />

      {/* Footer */}
      <div style={{ fontSize:11, color:a.muted, lineHeight:1.6, paddingTop:16, borderTop:`1px solid ${a.line}`, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:24, height:24, borderRadius:12, background:a.accent, color:a.paper, display:'grid', placeItems:'center', fontSize:10, fontWeight:600 }}>NK</div>
        <div>
          <div style={{ color:a.ink, fontSize:12.5, fontWeight:500 }}>noah.eth</div>
          <div style={{ fontFamily:a.mono, fontSize:10.5 }}>0x7a…e9f2</div>
        </div>
      </div>
    </div>
  );
}

// ─── Entities list ──────────────────────────────────────────────────
function AtlasEntities({ sel, setSel, filterType, setFilterType, onOpen }) {
  const rows = window.ENTITIES;
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
  const filtered = rows.filter(r => filterType === 'all' ? true : r.type === filterType);

  return (
    <div style={{ padding:'48px 56px 56px', maxWidth:1500, margin:'0 auto' }}>
      {/* Masthead */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:24, marginBottom:28, paddingBottom:24, borderBottom:`1px solid ${a.line}` }}>
        <div>
          <div style={{ fontSize:11, color:a.muted, textTransform:'uppercase', letterSpacing:2, fontWeight:600, marginBottom:8 }}>Vol. I · Healthcare codes</div>
          <h1 style={{ fontFamily:a.serif, fontSize:46, fontWeight:500, letterSpacing:-1.2, margin:0, lineHeight:1 }}>
            Entities
            <span style={{ fontFamily:a.mono, fontSize:16, color:a.muted, fontWeight:400, marginLeft:14, letterSpacing:0 }}>12,481</span>
          </h1>
          <div style={{ fontFamily:a.serif, fontStyle:'italic', fontSize:16, color:a.muted, marginTop:10, maxWidth:520 }}>
            All entities and properties currently stored in this space, sorted most recently updated first.
          </div>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', gap:8 }}>
          {sel.size > 0 && (
            <AButton variant="danger">Delete {sel.size}</AButton>
          )}
          <AButton>Import</AButton>
          <AButton variant="primary">+ New entity</AButton>
        </div>
      </div>

      {/* Facets */}
      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20, fontSize:13 }}>
        <div style={{ color:a.muted, fontSize:11, textTransform:'uppercase', letterSpacing:2, fontWeight:600 }}>Filter</div>
        <Facet active={filterType==='all'} onClick={()=>setFilterType('all')} count="12,481">All</Facet>
        <Facet active={filterType==='Entity'} onClick={()=>setFilterType('Entity')} count="8,204">Entities</Facet>
        <Facet active={filterType==='Property'} onClick={()=>setFilterType('Property')} count="4,277">Properties</Facet>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:a.paper, border:`1px solid ${a.line}`, borderRadius:4, minWidth:260 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" style={{ color:a.muted }}><circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" fill="none" strokeWidth="1.2"/><path d="M8.5 8.5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <input placeholder="Search by name or id…" style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:'inherit', fontSize:13, color:a.ink }} />
          <span style={{ fontFamily:a.mono, fontSize:10.5, color:a.faint, padding:'1px 5px', border:`1px solid ${a.line}`, borderRadius:3 }}>⌘K</span>
        </div>
      </div>

      {/* List — editorial, not a boxed table */}
      <div>
        {/* Header row */}
        <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 320px 110px 170px', padding:'10px 4px', borderBottom:`1px solid ${a.ink}`, fontSize:10.5, color:a.ink, textTransform:'uppercase', letterSpacing:1.8, fontWeight:600, alignItems:'center' }}>
          <div><ACheckbox
            checked={filtered.every(r => sel.has(r.id)) && filtered.length>0}
            indeterminate={filtered.some(r => sel.has(r.id)) && !filtered.every(r => sel.has(r.id))}
            onChange={() => setSel(sel.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))}
          /></div>
          <div>Name</div>
          <div>Identifier</div>
          <div>Kind</div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>Updated <span style={{ color:a.accent }}>↓</span></div>
        </div>

        {filtered.map((r) => (
          <div key={r.id} onClick={() => onOpen && onOpen()}
            style={{ display:'grid', gridTemplateColumns:'32px 1fr 320px 110px 170px', padding:'14px 4px',
              borderBottom: `1px solid ${a.lineSoft}`,
              alignItems:'center', cursor:'pointer',
              background: sel.has(r.id) ? a.accentBg + 'aa' : 'transparent' }}
            onMouseEnter={(e)=>{ if(!sel.has(r.id)) e.currentTarget.style.background = a.hover; }}
            onMouseLeave={(e)=>{ if(!sel.has(r.id)) e.currentTarget.style.background = 'transparent'; }}>
            <div onClick={(e)=>{e.stopPropagation(); toggle(r.id);}}><ACheckbox checked={sel.has(r.id)} /></div>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, minWidth:0 }}>
              <span style={{ fontFamily:a.serif, fontSize:18, fontWeight:500, color:a.ink, letterSpacing:-0.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
              {r.type === 'Property' && <span style={{ fontFamily:a.serif, fontStyle:'italic', fontSize:13, color:a.muted }}>property</span>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:a.mono, fontSize:11.5, color:a.muted }}>
              <span>{r.id.slice(0,12)}…{r.id.slice(-8)}</span>
              <button onClick={(e)=>e.stopPropagation()} style={{ border:'none', background:'transparent', color:a.faint, cursor:'pointer', padding:2 }}>
                <svg width="11" height="11" viewBox="0 0 11 11"><rect x="3" y="3" width="6.5" height="6.5" rx="1" stroke="currentColor" fill="none" strokeWidth="1"/><path d="M1.5 7.5V2a.5.5 0 0 1 .5-.5h5.5" stroke="currentColor" fill="none" strokeWidth="1"/></svg>
              </button>
            </div>
            <div>
              <span style={{ fontSize:11, color: r.type === 'Property' ? a.accent : a.ink2, fontFamily:a.mono, letterSpacing:0.5, textTransform:'uppercase' }}>
                {r.type === 'Property' ? '◆ prop' : '● entity'}
              </span>
            </div>
            <div style={{ color:a.muted, fontSize:12.5 }}>
              Apr 15 <span style={{ color:a.faint }}>·</span> <span style={{ fontFamily:a.mono, fontSize:11.5 }}>11:12 PM</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', marginTop:24, paddingTop:16, borderTop:`1px solid ${a.line}`, fontSize:12, color:a.muted }}>
        <span style={{ fontFamily:a.serif, fontStyle:'italic' }}>Entries 1 through {filtered.length} of 12,481</span>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:14, fontFamily:a.mono, fontSize:12 }}>
          <span style={{ color:a.faint }}>‹ prev</span>
          <span style={{ color:a.ink, fontWeight:500 }}>1</span>
          <span>2</span>
          <span>3</span>
          <span style={{ color:a.faint }}>…</span>
          <span>625</span>
          <span style={{ color:a.ink2 }}>next ›</span>
        </div>
      </div>
    </div>
  );
}

function Facet({ active, onClick, count, children }) {
  return (
    <button onClick={onClick} style={{
      border:'none', background:'transparent', padding:'4px 0', cursor:'pointer', fontFamily:'inherit', fontSize:14,
      color: active ? a.ink : a.muted,
      borderBottom: active ? `2px solid ${a.accent}` : '2px solid transparent',
      fontWeight: active ? 500 : 400,
      display:'flex', alignItems:'baseline', gap:6,
    }}>
      {children}
      <span style={{ fontFamily:a.mono, fontSize:11, color:a.faint, fontVariantNumeric:'tabular-nums' }}>{count}</span>
    </button>
  );
}

function AButton({ variant, children }) {
  const styles = {
    primary: { background:a.ink, color:a.paper, border:`1px solid ${a.ink}` },
    danger:  { background:'transparent', color:a.danger, border:`1px solid ${a.danger}44` },
    default: { background:a.paper, color:a.ink, border:`1px solid ${a.line}` },
  }[variant ?? 'default'];
  return <button style={{ ...styles, padding:'7px 14px', borderRadius:3, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>{children}</button>;
}

function ACheckbox({ checked, indeterminate, onChange }) {
  return (
    <div onClick={onChange} style={{
      width:15, height:15, borderRadius:2, cursor:'pointer',
      border: checked || indeterminate ? `1px solid ${a.accent}` : `1px solid ${a.faint}`,
      background: checked || indeterminate ? a.accent : a.paper,
      display:'grid', placeItems:'center', transition:'all .12s' }}>
      {checked && <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke={a.paper} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
      {indeterminate && !checked && <div style={{ width:7, height:1.5, background:a.paper }} />}
    </div>
  );
}

// ─── Detail ─────────────────────────────────────────────────────────
function AtlasDetail({ onBack }) {
  return (
    <div style={{ padding:'40px 56px 56px', maxWidth:1400, margin:'0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize:12, color:a.muted, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={onBack} style={{ border:'none', background:'transparent', color:a.muted, cursor:'pointer', padding:0, fontFamily:'inherit', fontSize:12 }}>Entities</button>
        <span style={{ color:a.faint }}>›</span>
        <span style={{ color:a.ink }}>Action Code</span>
      </div>

      {/* Article header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end', gap:24, paddingBottom:20, borderBottom:`1px solid ${a.line}`, marginBottom:28 }}>
        <div>
          <div style={{ fontSize:11, color:a.accent, textTransform:'uppercase', letterSpacing:2.5, fontWeight:600, marginBottom:12 }}>◆ Property</div>
          <h1 style={{ fontFamily:a.serif, fontSize:56, fontWeight:500, letterSpacing:-1.6, margin:0, lineHeight:1 }}>Action Code</h1>
          <p style={{ fontFamily:a.serif, fontStyle:'italic', fontSize:18, color:a.muted, marginTop:16, marginBottom:0, maxWidth:640, lineHeight:1.5 }}>
            CMS action on this code: A=Add, C=Change, D=Delete, N=No change.
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:18, fontSize:12, color:a.muted, flexWrap:'wrap' }}>
            <span style={{ fontFamily:a.mono, fontSize:11.5, color:a.ink2 }}>021ccf8634a48e3891a8fa286b7683f5</span>
            <span style={{ color:a.faint }}>·</span>
            <span>Created <span style={{ color:a.ink2 }}>Apr 15, 2026</span></span>
            <span style={{ color:a.faint }}>·</span>
            <span>Updated <span style={{ color:a.ink2 }}>Apr 15, 2026</span></span>
            <span style={{ color:a.faint }}>·</span>
            <span>Data type <span style={{ color:a.ink2, fontFamily:a.mono }}>text</span></span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <AButton>Edit</AButton>
          <AButton variant="danger">Delete</AButton>
        </div>
      </div>

      {/* 2-col body */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:40 }}>
        {/* Main */}
        <div>
          {/* Properties */}
          <SectionHead num="I" title="Properties" count="2" />
          <div style={{ marginBottom:36 }}>
            <AProp k="name"        type="text" v="Action Code" />
            <AProp k="description" type="text" v="CMS action on this code: A=Add, C=Change, D=Delete, N=No change" multi />
          </div>

          {/* Relations */}
          <SectionHead num="II" title="Relations" count="3" action="+ Add relation" />
          <div>
            <ARel pred="Types"      dir="out" target="Property" kind="type" />
            <ARel pred="Data type"  dir="out" target="Text"     kind="type" />
            <ARel pred="Properties" dir="in"  target="HCPCS Level II code" kind="entity" />
          </div>

          {/* JSON */}
          <SectionHead num="III" title="Raw record" />
          <pre style={{ fontFamily:a.mono, fontSize:12, background:a.paper, border:`1px solid ${a.line}`, padding:'16px 20px', borderRadius:3, color:a.ink2, lineHeight:1.65, whiteSpace:'pre-wrap', wordBreak:'break-all', margin:0 }}>
{`{
  "id":        "021ccf8634a48e3891a8fa286b7683f5",
  "type":      "Property",
  "dataType":  "text",
  "name":      "Action Code",
  "description": "CMS action on this code: A=Add, C=Change, D=Delete, N=No change",
  "createdAt": "2026-04-15T23:12:00Z",
  "updatedAt": "2026-04-15T23:12:00Z"
}`}
          </pre>
        </div>

        {/* Aside */}
        <div>
          {/* Neighborhood */}
          <div style={{ background:a.paper, border:`1px solid ${a.line}`, borderRadius:3, overflow:'hidden', marginBottom:20 }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${a.line}`, display:'flex', alignItems:'center' }}>
              <div style={{ fontFamily:a.serif, fontSize:17, fontWeight:500, color:a.ink }}>Neighborhood</div>
              <div style={{ flex:1 }} />
              <span style={{ fontFamily:a.mono, fontSize:11, color:a.muted }}>3 · 3</span>
            </div>
            <div style={{ height:200, position:'relative', background:a.bg }}>
              <ANode x="50%" y="50%" label="Action Code" primary />
              <ANode x="18%" y="24%" label="Property" />
              <ANode x="82%" y="24%" label="Text" />
              <ANode x="50%" y="86%" label="HCPCS Level II" />
              <AEdge from={[50,50]} to={[18,24]} />
              <AEdge from={[50,50]} to={[82,24]} />
              <AEdge from={[50,50]} to={[50,86]} />
            </div>
          </div>

          {/* History */}
          <div style={{ background:a.paper, border:`1px solid ${a.line}`, borderRadius:3 }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${a.line}`, fontFamily:a.serif, fontSize:17, fontWeight:500 }}>History</div>
            <div style={{ padding:'4px 0' }}>
              <HRow when="2s ago" who="noah.eth" what="Updated description" />
              <HRow when="14m ago" who="system" what="Synced from ipfs://Qm…" />
              <HRow when="3h ago" who="alice.eth" what="Added relation → Text" />
              <HRow when="Apr 14" who="noah.eth" what="Created entity" last />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ num, title, count, action }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:18, paddingBottom:6, borderBottom:`1px solid ${a.lineSoft}` }}>
      <span style={{ fontFamily:a.serif, fontSize:13, color:a.accent, fontStyle:'italic', fontWeight:500, minWidth:22 }}>{num}</span>
      <div style={{ fontFamily:a.serif, fontSize:22, fontWeight:500, letterSpacing:-0.5, color:a.ink }}>{title}</div>
      {count && <div style={{ fontFamily:a.mono, fontSize:12, color:a.muted }}>{count}</div>}
      <div style={{ flex:1 }} />
      {action && <button style={{ border:'none', background:'transparent', color:a.accent, cursor:'pointer', fontFamily:'inherit', fontSize:12.5, fontWeight:500 }}>{action}</button>}
    </div>
  );
}

function AProp({ k, type, v, multi }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', padding:'14px 0', borderBottom:`1px solid ${a.lineSoft}`, alignItems: multi ? 'flex-start' : 'baseline', gap:20 }}>
      <div>
        <div style={{ fontFamily:a.mono, fontSize:12.5, color:a.ink2 }}>{k}</div>
        <div style={{ fontSize:10.5, color:a.muted, marginTop:3, textTransform:'uppercase', letterSpacing:1.5 }}>{type}</div>
      </div>
      <div style={{ fontFamily: multi ? a.serif : a.sans, fontSize: multi ? 16 : 14, color:a.ink, lineHeight:1.55, fontStyle: multi ? 'normal' : 'normal' }}>{v}</div>
    </div>
  );
}

function ARel({ pred, dir, target, kind }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'180px auto 1fr', padding:'12px 0', borderBottom:`1px solid ${a.lineSoft}`, alignItems:'center', gap:20 }}>
      <div style={{ fontFamily:a.mono, fontSize:12.5, color:a.ink2 }}>{pred}</div>
      <span style={{ fontFamily:a.mono, fontSize:13, color:a.faint }}>{dir === 'out' ? '——→' : '←——'}</span>
      <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
        <span style={{ fontFamily:a.serif, fontSize:17, color:a.accent, fontWeight:500, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3, textDecorationColor:a.accent + '44' }}>{target}</span>
        <span style={{ fontSize:10.5, color:a.muted, textTransform:'uppercase', letterSpacing:1.5 }}>{kind}</span>
      </div>
    </div>
  );
}

function ANode({ x, y, label, primary }) {
  return (
    <div style={{ position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)',
      padding:'4px 10px', borderRadius:2, fontSize:11, whiteSpace:'nowrap', fontFamily:a.serif, fontWeight:500,
      background: primary ? a.ink : a.paper, color: primary ? a.paper : a.ink2,
      border: primary ? 'none' : `1px solid ${a.line}`, zIndex:2 }}>{label}</div>
  );
}

function AEdge({ from, to }) {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
      <line x1={from[0]+'%'} y1={from[1]+'%'} x2={to[0]+'%'} y2={to[1]+'%'} stroke={a.faint} strokeWidth="1"/>
    </svg>
  );
}

function HRow({ when, who, what, last }) {
  return (
    <div style={{ padding:'10px 18px', borderBottom: last ? 'none' : `1px solid ${a.lineSoft}` }}>
      <div style={{ fontSize:13, color:a.ink, lineHeight:1.4 }}>{what}</div>
      <div style={{ fontSize:11.5, color:a.muted, marginTop:3 }}>
        <span style={{ fontFamily:a.mono, color:a.ink2 }}>{who}</span> · {when}
      </div>
    </div>
  );
}

function AtlasEmpty({ label, hint }) {
  return (
    <div style={{ padding:'48px 56px', maxWidth:1400, margin:'0 auto' }}>
      <h1 style={{ fontFamily:a.serif, fontSize:46, fontWeight:500, letterSpacing:-1.2, margin:0 }}>{label}</h1>
      <p style={{ fontFamily:a.serif, fontStyle:'italic', color:a.muted, fontSize:17 }}>{hint}</p>
    </div>
  );
}

Object.assign(window, { AtlasApp });
