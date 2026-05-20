// ════════════════════════════════════════════════════════════════════
// PRISM — bold graphic aesthetic
// Palette: near-black on ivory; saturated lime-cyan accent
// Type: Space Grotesk display + Inter body + JetBrains Mono
// Personality: confident, high-contrast, opinionated
// ════════════════════════════════════════════════════════════════════

const p = {
  bg:      '#0a0a0a',
  canvas:  '#f3f2ed',
  paper:   '#ffffff',
  ink:     '#0a0a0a',
  ink2:    '#2a2a2a',
  muted:   '#6b6b6b',
  faint:   '#a8a8a5',
  line:    '#1c1c1c',
  lineSoft:'#e6e4dd',
  hover:   '#ecebe4',
  accent:  '#c6ff3d',     // electric lime
  accent2: '#ff5a1f',     // orange pop
  danger:  '#ff3838',
  display: '"Space Grotesk", "Inter", sans-serif',
  sans:    '"Inter", -apple-system, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
};

function PrismApp({ initial = 'entities', preselect = false }) {
  const [page, setPage] = React.useState(initial);
  const [sel, setSel] = React.useState(preselect ? new Set(['021ccf8634a48e3891a8fa286b7683f5','0c5a42e1676b8ed381ad822580c445cf','087dd7603153830bbd4555985a73d1d8']) : new Set());
  const [filterType, setFilterType] = React.useState('all');

  return (
    <div style={{ width:'100%', height:'100%', background:p.canvas, color:p.ink, fontFamily:p.sans, fontSize:13, display:'flex' }}>
      <PrismSidebar page={page} setPage={setPage} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{ flex:1, overflow:'auto' }}>
          {page === 'entities' && <PrismEntities sel={sel} setSel={setSel} filterType={filterType} setFilterType={setFilterType} onOpen={() => setPage('detail')} />}
          {page === 'detail' && <PrismDetail onBack={() => setPage('entities')} />}
          {page === 'search' && <PrismEmpty label="SEARCH" hint="Query the graph" />}
          {page === 'graph' && <PrismEmpty label="GRAPH" hint="50 nodes · click to inspect" />}
          {page === 'edits' && <PrismEmpty label="EDITS" hint="3 pending changes" />}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar — BLACK with lime accent ────────────────────────────────
function PrismSidebar({ page, setPage }) {
  const items = [
    { id:'entities', label:'Entities', count:'12481', k:'E' },
    { id:'search',   label:'Search', k:'S' },
    { id:'graph',    label:'Graph', count:'50', k:'G' },
    { id:'edits',    label:'Edits', count:'3', k:'D' },
  ];
  return (
    <div style={{ width:224, background:p.bg, color:p.paper, display:'flex', flexDirection:'column', flexShrink:0 }}>
      {/* Brand block */}
      <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid #1f1f1f' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:p.accent, display:'grid', placeItems:'center', position:'relative' }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 2l12 12M14 2L2 14M8 1v14M1 8h14" stroke={p.ink} strokeWidth="1.6"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:p.display, fontSize:20, fontWeight:700, letterSpacing:-0.8, lineHeight:1 }}>PRISM</div>
            <div style={{ fontSize:9.5, color:p.faint, letterSpacing:2.5, textTransform:'uppercase', marginTop:3, fontFamily:p.mono }}>knowledge/graph</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding:'14px 12px', flex:1 }}>
        {items.map(it => {
          const active = page === it.id;
          return (
            <button key={it.id} onClick={() => setPage(it.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'none',
                background: active ? p.accent : 'transparent',
                color: active ? p.ink : p.paper,
                borderRadius:0, cursor:'pointer', fontFamily:'inherit', fontSize:13, textAlign:'left',
                fontWeight: active ? 700 : 500, letterSpacing: active ? -0.2 : -0.1, marginBottom:2,
                textTransform:'uppercase' }}>
              <span style={{ width:18, height:18, background: active ? p.ink : '#1f1f1f', color: active ? p.accent : p.faint, display:'grid', placeItems:'center', fontFamily:p.mono, fontSize:10, fontWeight:700 }}>{it.k}</span>
              <span style={{ flex:1 }}>{it.label}</span>
              {it.count && <span style={{ fontFamily:p.mono, fontSize:10.5, color: active ? p.ink : p.faint, fontVariantNumeric:'tabular-nums' }}>{it.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Space card */}
      <div style={{ margin:'0 12px 12px', padding:'12px 14px', border:`1px solid #262626`, background:'#0f0f0f' }}>
        <div style={{ fontSize:9.5, color:p.faint, textTransform:'uppercase', letterSpacing:2, fontFamily:p.mono, marginBottom:6 }}>Space</div>
        <div style={{ fontSize:13, fontWeight:600, color:p.paper }}>Healthcare codes</div>
        <div style={{ fontSize:11, color:p.faint, marginTop:2, fontFamily:p.mono }}>CMS · HCPCS · 2026</div>
      </div>

      {/* Footer */}
      <div style={{ padding:'14px 20px', borderTop:'1px solid #1f1f1f', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:26, height:26, background:p.accent, color:p.ink, display:'grid', placeItems:'center', fontSize:11, fontWeight:700, fontFamily:p.display }}>NK</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600 }}>noah.eth</div>
          <div style={{ fontFamily:p.mono, fontSize:10, color:p.faint }}>0x7a…e9f2</div>
        </div>
      </div>
    </div>
  );
}

// ─── Entities ───────────────────────────────────────────────────────
function PrismEntities({ sel, setSel, filterType, setFilterType, onOpen }) {
  const rows = window.ENTITIES;
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
  const filtered = rows.filter(r => filterType === 'all' ? true : r.type === filterType);

  return (
    <div style={{ padding:'32px 40px 56px', maxWidth:1600, margin:'0 auto' }}>
      {/* Big masthead block */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end', marginBottom:24, gap:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ width:8, height:8, background:p.accent }} />
            <span style={{ fontFamily:p.mono, fontSize:11, letterSpacing:2, textTransform:'uppercase', color:p.muted }}>/entities</span>
          </div>
          <h1 style={{ fontFamily:p.display, fontSize:72, fontWeight:700, letterSpacing:-3.5, margin:0, lineHeight:.9 }}>
            Entities<span style={{ color:p.accent2 }}>.</span>
          </h1>
          <div style={{ display:'flex', gap:32, marginTop:18, fontFamily:p.mono, fontSize:12 }}>
            <Stat k="TOTAL" v="12,481" />
            <Stat k="ENTITIES" v="8,204" />
            <Stat k="PROPERTIES" v="4,277" />
            <Stat k="PENDING EDITS" v="3" accent />
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {sel.size > 0 && <PBtn variant="danger">DELETE · {sel.size}</PBtn>}
          <PBtn>IMPORT</PBtn>
          <PBtn variant="primary">+ NEW ENTITY</PBtn>
        </div>
      </div>

      {/* Filter chips — bold */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:20, border:`2px solid ${p.ink}`, background:p.paper, width:'fit-content' }}>
        {[
          { id:'all',      label:'ALL',        count:'12,481' },
          { id:'Entity',   label:'ENTITIES',   count:'8,204' },
          { id:'Property', label:'PROPERTIES', count:'4,277' },
        ].map((f, i) => {
          const active = filterType === f.id;
          return (
            <button key={f.id} onClick={() => setFilterType(f.id)}
              style={{ border:'none', background: active ? p.ink : 'transparent', color: active ? p.accent : p.ink,
                padding:'9px 18px', fontFamily:p.display, fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:-0.2,
                borderLeft: i > 0 ? `2px solid ${p.ink}` : 'none', display:'flex', alignItems:'center', gap:8 }}>
              {f.label}
              <span style={{ fontFamily:p.mono, fontSize:11, fontWeight:500, color: active ? p.faint : p.muted }}>{f.count}</span>
            </button>
          );
        })}
        <div style={{ borderLeft:`2px solid ${p.ink}`, padding:'0 12px', display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" style={{ color:p.muted }}><circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" fill="none" strokeWidth="1.4"/><path d="M8.5 8.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <input placeholder="Search…" style={{ border:'none', outline:'none', background:'transparent', fontFamily:p.mono, fontSize:12, color:p.ink, width:140 }} />
        </div>
      </div>

      {/* Table — flat, heavy borders */}
      <div style={{ background:p.paper, border:`2px solid ${p.ink}` }}>
        {/* header */}
        <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 340px 130px 170px 44px', alignItems:'center', padding:'10px 14px', borderBottom:`2px solid ${p.ink}`, fontFamily:p.mono, fontSize:10.5, color:p.ink, textTransform:'uppercase', letterSpacing:1.8, fontWeight:700, background:p.accent }}>
          <div><PCheckbox onDark
            checked={filtered.every(r => sel.has(r.id)) && filtered.length>0}
            indeterminate={filtered.some(r => sel.has(r.id)) && !filtered.every(r => sel.has(r.id))}
            onChange={() => setSel(sel.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))} /></div>
          <div>Name</div>
          <div>ID</div>
          <div>Kind</div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>Updated ↓</div>
          <div></div>
        </div>

        {filtered.map((r, i) => (
          <div key={r.id} onClick={() => onOpen && onOpen()}
            style={{ display:'grid', gridTemplateColumns:'44px 1fr 340px 130px 170px 44px', alignItems:'center', padding:'11px 14px',
              borderBottom: i === filtered.length-1 ? 'none' : `1px solid ${p.lineSoft}`,
              cursor:'pointer',
              background: sel.has(r.id) ? p.accent + '66' : 'transparent' }}
            onMouseEnter={(e)=>{ if(!sel.has(r.id)) e.currentTarget.style.background = p.hover; }}
            onMouseLeave={(e)=>{ if(!sel.has(r.id)) e.currentTarget.style.background = 'transparent'; }}>
            <div onClick={(e)=>{e.stopPropagation(); toggle(r.id);}}><PCheckbox checked={sel.has(r.id)} /></div>
            <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
              <span style={{ fontFamily:p.display, fontSize:16, fontWeight:600, color:p.ink, letterSpacing:-0.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:p.muted, fontFamily:p.mono, fontSize:11 }}>
              <span>{r.id}</span>
              <button onClick={(e)=>e.stopPropagation()} style={{ border:'none', background:'transparent', color:p.faint, cursor:'pointer', padding:2 }}>
                <svg width="11" height="11" viewBox="0 0 11 11"><rect x="3" y="3" width="6.5" height="6.5" stroke="currentColor" fill="none" strokeWidth="1.2"/><path d="M1.5 7.5V2a.5.5 0 0 1 .5-.5h5.5" stroke="currentColor" fill="none" strokeWidth="1.2"/></svg>
              </button>
            </div>
            <div>
              {r.type === 'Property'
                ? <span style={{ fontFamily:p.mono, fontSize:10.5, color:p.ink, background:p.accent2, padding:'3px 8px', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>◆ PROP</span>
                : <span style={{ fontFamily:p.mono, fontSize:10.5, color:p.ink, background:p.accent, padding:'3px 8px', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>● ENT</span>}
            </div>
            <div style={{ color:p.muted, fontSize:12, fontFamily:p.mono, fontVariantNumeric:'tabular-nums' }}>04.15.26 <span style={{ color:p.faint }}>//</span> 23:12</div>
            <div style={{ textAlign:'right' }}><svg width="14" height="14" viewBox="0 0 14 14" style={{ color:p.ink }}><path d="M5 3l4 4-4 4M3 7h6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg></div>
          </div>
        ))}

        {/* footer */}
        <div style={{ display:'flex', alignItems:'center', padding:'10px 14px', borderTop:`2px solid ${p.ink}`, background:p.ink, color:p.paper, fontFamily:p.mono, fontSize:11, letterSpacing:1, textTransform:'uppercase' }}>
          <span>Page 01 of 625 · Showing {filtered.length}/12,481</span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:p.faint }}>‹ PREV</span>
            <span style={{ color:p.accent, fontWeight:700 }}>01</span>
            <span>02</span>
            <span>03</span>
            <span style={{ color:p.faint }}>·</span>
            <span>625</span>
            <span>NEXT ›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, accent }) {
  return (
    <div>
      <div style={{ fontSize:10, color:p.muted, letterSpacing:2, fontWeight:600 }}>{k}</div>
      <div style={{ fontFamily:p.display, fontSize:20, fontWeight:600, letterSpacing:-0.6, color: accent ? p.accent2 : p.ink, marginTop:2 }}>{v}</div>
    </div>
  );
}

function PBtn({ variant, children }) {
  const styles = {
    primary: { background:p.ink, color:p.accent, border:`2px solid ${p.ink}` },
    danger:  { background:p.danger, color:p.paper, border:`2px solid ${p.danger}` },
    default: { background:p.paper, color:p.ink, border:`2px solid ${p.ink}` },
  }[variant ?? 'default'];
  return <button style={{ ...styles, padding:'7px 16px', borderRadius:0, fontSize:12, cursor:'pointer', fontFamily:p.display, fontWeight:700, letterSpacing:-0.2, textTransform:'uppercase' }}>{children}</button>;
}

function PCheckbox({ checked, indeterminate, onChange, onDark }) {
  return (
    <div onClick={onChange} style={{
      width:16, height:16, borderRadius:0, cursor:'pointer',
      border: `1.5px solid ${p.ink}`,
      background: checked || indeterminate ? p.ink : (onDark ? p.accent : p.paper),
      display:'grid', placeItems:'center' }}>
      {checked && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={p.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {indeterminate && !checked && <div style={{ width:8, height:2, background:p.accent }} />}
    </div>
  );
}

// ─── Detail ─────────────────────────────────────────────────────────
function PrismDetail({ onBack }) {
  return (
    <div style={{ padding:'32px 40px 56px', maxWidth:1500, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, fontFamily:p.mono, fontSize:11, textTransform:'uppercase', letterSpacing:2 }}>
        <button onClick={onBack} style={{ border:'none', background:'transparent', color:p.muted, cursor:'pointer', fontFamily:'inherit', fontSize:'inherit', letterSpacing:'inherit', textTransform:'inherit', padding:0 }}>/entities</button>
        <span style={{ color:p.faint }}>/</span>
        <span style={{ color:p.ink }}>021ccf86…</span>
      </div>

      {/* Big headline */}
      <div style={{ background:p.ink, color:p.paper, padding:'28px 32px', marginBottom:0, border:`2px solid ${p.ink}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end', gap:24 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontFamily:p.mono, fontSize:10.5, color:p.ink, background:p.accent2, padding:'3px 9px', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>◆ PROPERTY</span>
              <span style={{ fontFamily:p.mono, fontSize:10.5, color:p.accent, textTransform:'uppercase', letterSpacing:1.5 }}>● published</span>
            </div>
            <h1 style={{ fontFamily:p.display, fontSize:64, fontWeight:700, letterSpacing:-2.8, margin:0, lineHeight:.95 }}>
              Action Code<span style={{ color:p.accent }}>.</span>
            </h1>
            <div style={{ fontFamily:p.mono, fontSize:12, color:p.faint, marginTop:14, wordBreak:'break-all' }}>
              021ccf8634a48e3891a8fa286b7683f5
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ background:p.accent, color:p.ink, border:'none', padding:'8px 16px', fontFamily:p.display, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase', letterSpacing:-0.2 }}>EDIT</button>
            <button style={{ background:'transparent', color:p.paper, border:`2px solid ${p.paper}`, padding:'6px 16px', fontFamily:p.display, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase', letterSpacing:-0.2 }}>DELETE</button>
          </div>
        </div>
        {/* meta strip */}
        <div style={{ display:'flex', gap:32, marginTop:24, paddingTop:18, borderTop:`1px solid #222` }}>
          <MetaItem k="CREATED" v="APR 15, 2026" sub="23:12 UTC" />
          <MetaItem k="UPDATED" v="APR 15, 2026" sub="23:12 UTC" />
          <MetaItem k="DATA TYPE" v="TEXT" />
          <MetaItem k="RELATIONS" v="3" />
          <MetaItem k="REVISION" v="#14" />
        </div>
      </div>

      {/* Content grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:0, border:`2px solid ${p.ink}`, borderTop:'none' }}>
        {/* Left — properties + relations */}
        <div style={{ borderRight:`2px solid ${p.ink}`, background:p.paper }}>
          <PSection title="PROPERTIES" count="2" />
          <PPropRow k="name"        type="text" v="Action Code" />
          <PPropRow k="description" type="text" v="CMS action on this code: A=Add, C=Change, D=Delete, N=No change" last />

          <PSection title="RELATIONS" count="3" action="+ ADD" />
          <PRelRow pred="Types"      dir="out" target="Property" kind="type" />
          <PRelRow pred="Data type"  dir="out" target="Text"     kind="type" />
          <PRelRow pred="Properties" dir="in"  target="HCPCS Level II code" kind="entity" last />
        </div>

        {/* Right — graph + activity */}
        <div style={{ background:p.canvas }}>
          <div style={{ padding:'14px 20px', borderBottom:`2px solid ${p.ink}`, display:'flex', alignItems:'center', background:p.paper }}>
            <div style={{ fontFamily:p.display, fontSize:14, fontWeight:700, letterSpacing:-0.2, textTransform:'uppercase' }}>NEIGHBORHOOD</div>
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:p.mono, fontSize:11, color:p.muted }}>3 NODES / 3 EDGES</span>
          </div>
          <div style={{ height:260, position:'relative', borderBottom:`2px solid ${p.ink}`,
            backgroundImage:`linear-gradient(${p.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${p.lineSoft} 1px, transparent 1px)`,
            backgroundSize:'16px 16px' }}>
            <PNode x="50%" y="50%" label="Action Code" primary />
            <PNode x="18%" y="22%" label="Property" />
            <PNode x="82%" y="22%" label="Text" />
            <PNode x="50%" y="85%" label="HCPCS Level II" />
            <PEdge from={[50,50]} to={[18,22]} label="types" />
            <PEdge from={[50,50]} to={[82,22]} label="data type" />
            <PEdge from={[50,50]} to={[50,85]} label="props" inbound />
          </div>

          <div style={{ padding:'14px 20px', borderBottom:`2px solid ${p.ink}`, fontFamily:p.display, fontSize:14, fontWeight:700, letterSpacing:-0.2, textTransform:'uppercase', background:p.paper }}>
            HISTORY
          </div>
          <PHist when="2S" who="noah.eth" what="Updated description" />
          <PHist when="14M" who="system" what="Synced from ipfs://Qm…" />
          <PHist when="3H" who="alice.eth" what="Added relation → Text" last />
        </div>
      </div>
    </div>
  );
}

function MetaItem({ k, v, sub }) {
  return (
    <div>
      <div style={{ fontFamily:p.mono, fontSize:9.5, color:p.faint, letterSpacing:2, fontWeight:600 }}>{k}</div>
      <div style={{ fontFamily:p.display, fontSize:14, fontWeight:700, color:p.paper, marginTop:3, letterSpacing:-0.2 }}>{v}</div>
      {sub && <div style={{ fontFamily:p.mono, fontSize:10, color:p.muted, marginTop:1 }}>{sub}</div>}
    </div>
  );
}

function PSection({ title, count, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', borderBottom:`2px solid ${p.ink}`, background:p.canvas, gap:10 }}>
      <div style={{ fontFamily:p.display, fontSize:14, fontWeight:700, letterSpacing:-0.2, textTransform:'uppercase' }}>{title}</div>
      {count && <div style={{ fontFamily:p.mono, fontSize:11, color:p.muted, background:p.paper, padding:'1px 7px', border:`1px solid ${p.ink}` }}>{count}</div>}
      <div style={{ flex:1 }} />
      {action && <button style={{ border:`1.5px solid ${p.ink}`, background:p.paper, color:p.ink, padding:'3px 10px', fontFamily:p.display, fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:-0.1 }}>{action}</button>}
    </div>
  );
}

function PPropRow({ k, type, v, last }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', padding:'14px 20px', borderBottom: last ? 'none' : `1px solid ${p.lineSoft}`, alignItems:'baseline', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:p.mono, fontSize:12, color:p.ink, fontWeight:500 }}>{k}</span>
        <span style={{ fontFamily:p.mono, fontSize:9.5, color:p.muted, background:p.canvas, padding:'1px 6px', border:`1px solid ${p.lineSoft}`, textTransform:'uppercase', letterSpacing:1 }}>{type}</span>
      </div>
      <div style={{ fontSize:14, color:p.ink, lineHeight:1.5 }}>{v}</div>
    </div>
  );
}

function PRelRow({ pred, dir, target, kind, last }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'180px auto 1fr', padding:'12px 20px', borderBottom: last ? 'none' : `1px solid ${p.lineSoft}`, alignItems:'center', gap:14 }}>
      <span style={{ fontFamily:p.mono, fontSize:12, color:p.ink2 }}>{pred}</span>
      <span style={{ fontFamily:p.mono, fontSize:15, color:p.ink, fontWeight:700 }}>{dir === 'out' ? '→' : '←'}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:p.display, fontSize:16, color:p.ink, fontWeight:600, cursor:'pointer', borderBottom:`2px solid ${p.accent}`, paddingBottom:1 }}>{target}</span>
        <span style={{ fontFamily:p.mono, fontSize:9.5, color:p.muted, textTransform:'uppercase', letterSpacing:1.5 }}>{kind}</span>
      </div>
    </div>
  );
}

function PNode({ x, y, label, primary }) {
  return (
    <div style={{ position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)',
      padding:'5px 11px', fontSize:11, whiteSpace:'nowrap', fontFamily:p.display, fontWeight:700,
      background: primary ? p.accent : p.paper, color: p.ink,
      border:`2px solid ${p.ink}`, zIndex:2, letterSpacing:-0.1 }}>{label}</div>
  );
}

function PEdge({ from, to, label, inbound }) {
  const mx = (from[0]+to[0])/2, my = (from[1]+to[1])/2;
  return (
    <>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
        <line x1={from[0]+'%'} y1={from[1]+'%'} x2={to[0]+'%'} y2={to[1]+'%'} stroke={p.ink} strokeWidth="1.5"/>
      </svg>
      <div style={{ position:'absolute', left:mx+'%', top:my+'%', transform:'translate(-50%,-50%)',
        fontFamily:p.mono, fontSize:9.5, color:p.ink, background:p.canvas, padding:'0 5px', letterSpacing:1, textTransform:'uppercase', fontWeight:600 }}>
        {inbound ? '← ' : ''}{label}{inbound ? '' : ' →'}
      </div>
    </>
  );
}

function PHist({ when, who, what, last }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'56px 1fr', padding:'12px 20px', borderBottom: last ? 'none' : `1px solid ${p.lineSoft}`, alignItems:'baseline', gap:12, background:p.paper }}>
      <div style={{ fontFamily:p.mono, fontSize:11, color:p.ink, fontWeight:700, letterSpacing:1 }}>{when}</div>
      <div>
        <div style={{ fontSize:13, color:p.ink, lineHeight:1.4 }}>{what}</div>
        <div style={{ fontFamily:p.mono, fontSize:10.5, color:p.muted, marginTop:2, textTransform:'uppercase', letterSpacing:1 }}>{who}</div>
      </div>
    </div>
  );
}

function PrismEmpty({ label, hint }) {
  return (
    <div style={{ padding:'32px 40px', maxWidth:1500, margin:'0 auto' }}>
      <h1 style={{ fontFamily:p.display, fontSize:72, fontWeight:700, letterSpacing:-3.5, margin:0, lineHeight:.9 }}>{label}<span style={{ color:p.accent2 }}>.</span></h1>
      <div style={{ fontFamily:p.mono, fontSize:13, color:p.muted, marginTop:14 }}>{hint}</div>
    </div>
  );
}

Object.assign(window, { PrismApp });
