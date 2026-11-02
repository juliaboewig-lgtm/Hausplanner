import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ChevronDown, Copy, DoorOpen,
  Grid3X3, Hand, Layers, Minus, MousePointer2, Plus, Redo2, Ruler,
  Save, Trash2, Undo2, BrickWall, ZoomIn, ZoomOut
} from "lucide-react";

type Point = { x: number; y: number };
type Wall = { id: string; a: Point; b: Point; thickness: number };
type Tool = "select" | "wall";
type Snapshot = { walls: Wall[]; selected: string | null };

const GRID = 20;
const STORAGE_KEY = "hausplaner-project-v1";
const snap = (n: number) => Math.round(n / GRID) * GRID;
const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const fmt = (n: number) => `${(n / 20).toFixed(2)} m`;

function App() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("wall");
  const [draft, setDraft] = useState<{ a: Point; b: Point } | null>(null);
  const [gridOn, setGridOn] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [projectName, setProjectName] = useState("Mein Haus");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [notice, setNotice] = useState("Klicke auf die Zeichenfläche, um eine Wand zu beginnen.");
  const svgRef = useRef<SVGSVGElement>(null);
  const selectedWall = walls.find(w => w.id === selected) ?? null;

  const saveHistory = (nextWalls: Wall[], nextSelected: string | null = null) => {
    setHistory(h => [...h.slice(-49), { walls, selected }]);
    setFuture([]);
    setWalls(nextWalls);
    setSelected(nextSelected);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setWalls(data.walls ?? []);
        setProjectName(data.projectName ?? "Mein Haus");
        setNotice("Dein zuletzt gespeicherter Entwurf wurde geladen.");
      } catch { /* ignore invalid local draft */ }
    }
  }, []);

  const saveProject = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ walls, projectName }));
    setNotice("Projekt wurde in diesem Browser gespeichert.");
  };

  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setFuture(f => [{ walls, selected }, ...f]);
    setWalls(previous.walls); setSelected(previous.selected);
    setHistory(h => h.slice(0, -1));
    setNotice("Letzte Änderung rückgängig gemacht.");
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory(h => [...h, { walls, selected }]);
    setWalls(next.walls); setSelected(next.selected);
    setFuture(f => f.slice(1));
    setNotice("Änderung wiederhergestellt.");
  };

  const pointFromEvent = (e: React.MouseEvent<SVGSVGElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: snap((e.clientX - rect.left - 36) / zoom),
      y: snap((e.clientY - rect.top - 28) / zoom)
    };
  };

  const onCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const p = pointFromEvent(e);
    if (tool === "wall") {
      if (!draft) {
        setDraft({ a: p, b: p });
        setNotice("Setze jetzt den Endpunkt der Wand.");
      } else {
        if (distance(draft.a, p) < GRID) {
          setDraft(null); setNotice("Wand zu kurz – bitte einen längeren Abschnitt zeichnen."); return;
        }
        const wall: Wall = { id: crypto.randomUUID(), a: draft.a, b: p, thickness: 12 };
        saveHistory([...walls, wall], wall.id);
        setDraft(null);
        setNotice(`Wand erstellt · ${fmt(distance(draft.a, p))}`);
      }
    } else {
      setSelected(null);
    }
  };

  const onCanvasMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draft) setDraft({ ...draft, b: pointFromEvent(e) });
  };

  const deleteSelected = () => {
    if (!selected) return;
    saveHistory(walls.filter(w => w.id !== selected));
    setNotice("Ausgewählte Wand gelöscht.");
  };

  const duplicateSelected = () => {
    if (!selectedWall) return;
    const copy: Wall = {
      ...selectedWall, id: crypto.randomUUID(),
      a: { x: selectedWall.a.x + GRID * 2, y: selectedWall.a.y + GRID * 2 },
      b: { x: selectedWall.b.x + GRID * 2, y: selectedWall.b.y + GRID * 2 }
    };
    saveHistory([...walls, copy], copy.id);
    setNotice("Wand dupliziert.");
  };

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ projectName, walls }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "hausplan"}.json`;
    a.click(); URL.revokeObjectURL(url);
    setNotice("Projektdatei exportiert.");
  };

  const totalLength = useMemo(() => walls.reduce((sum, w) => sum + distance(w.a, w.b), 0), [walls]);
  const gridLines = useMemo(() => {
    const lines = [];
    for (let x = 0; x <= 1500; x += GRID) lines.push(<line key={`v${x}`} x1={x} y1="0" x2={x} y2="1100" />);
    for (let y = 0; y <= 1100; y += GRID) lines.push(<line key={`h${y}`} x1="0" y1={y} x2="1500" y2={y} />);
    return lines;
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><span /></div><div><strong>Hausplaner</strong><small>Dein Raum. Deine Ideen.</small></div></div>
        <div className="project-title"><span>PROJEKT</span><input value={projectName} onChange={e => setProjectName(e.target.value)} aria-label="Projektname" /></div>
        <div className="top-actions">
          <button className="icon-button" title="Rückgängig" onClick={undo} disabled={!history.length}><Undo2 size={17}/></button>
          <button className="icon-button" title="Wiederholen" onClick={redo} disabled={!future.length}><Redo2 size={17}/></button>
          <button className="save-button" onClick={saveProject}><Save size={16}/> Speichern</button>
          <button className="export-button" onClick={exportProject}><ArrowDownToLine size={16}/> Export</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="left-panel">
          <div className="panel-heading"><span>WERKZEUGE</span><small>GRUNDRISS</small></div>
          <button className={`tool-button ${tool === "select" ? "active" : ""}`} onClick={() => {setTool("select");setDraft(null);setNotice("Wähle ein Element aus, um es zu bearbeiten.");}}><MousePointer2 size={18}/><span><b>Auswählen</b><small>Element markieren</small></span><kbd>V</kbd></button>
          <button className={`tool-button ${tool === "wall" ? "active" : ""}`} onClick={() => {setTool("wall");setSelected(null);setNotice("Klicke auf die Zeichenfläche, um eine Wand zu beginnen.");}}><BrickWall size={18}/><span><b>Wand zeichnen</b><small>Start- und Endpunkt setzen</small></span><kbd>W</kbd></button>
          <div className="panel-divider"/>
          <div className="section-label">ANSICHT</div>
          <button className="setting-row" onClick={() => setGridOn(v => !v)}><Grid3X3 size={17}/><span>Raster anzeigen</span><span className={`toggle ${gridOn ? "on" : ""}`} /></button>
          <div className="section-label">STOCKWERKE</div>
          <button className="floor-row selected-floor"><Layers size={17}/><span>Erdgeschoss</span><ChevronDown size={15}/></button>
          <div className="floor-note">Weitere Stockwerke werden in einer späteren Ausbaustufe ergänzt.</div>
          <div className="panel-divider"/>
          <div className="section-label">ELEMENTE</div>
          <div className="coming-item"><DoorOpen size={17}/><span>Türen & Fenster</span><em>Demnächst</em></div>
          <div className="coming-item"><Ruler size={17}/><span>Maßwerkzeuge</span><em>Demnächst</em></div>
          <div className="panel-bottom"><div className="tip-icon">✦</div><p><b>Dein erster Schritt</b><br/>Wähle „Wand zeichnen“ und klicke zweimal auf die Fläche, um einen Wandabschnitt zu erstellen.</p></div>
        </aside>

        <section className="canvas-area">
          <div className="canvas-toolbar">
            <div className="view-tabs"><button className="view-tab active">2D Grundriss</button><button className="view-tab disabled" title="Wird in einer späteren Ausbaustufe ergänzt">3D Vorschau <span>DEMNÄCHST</span></button></div>
            <div className="canvas-tools">
              <span className="scale-label">Raster · 1 m</span>
              <button className="icon-button" onClick={() => setZoom(z => Math.max(.5, +(z - .1).toFixed(2)))} title="Verkleinern"><ZoomOut size={16}/></button>
              <span className="zoom-value">{Math.round(zoom * 100)}%</span>
              <button className="icon-button" onClick={() => setZoom(z => Math.min(1.8, +(z + .1).toFixed(2)))} title="Vergrößern"><ZoomIn size={16}/></button>
            </div>
          </div>
          <div className="canvas-wrap">
            <div className="canvas-label"><span className="live-dot"/> ARBEITSFLÄCHE <span>/</span> ERDGESCHOSS</div>
            <svg ref={svgRef} className={`drawing-canvas ${tool === "wall" ? "wall-cursor" : ""}`} viewBox="0 0 1500 1100" onClick={onCanvasClick} onMouseMove={onCanvasMove} role="img" aria-label="2D-Grundriss-Zeichenfläche">
              <rect x="0" y="0" width="1500" height="1100" fill={gridOn ? "url(#grid)" : "#fbfaf7"}/>
              <defs><pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse"><path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#e9e6df" strokeWidth="1"/></pattern></defs>
              <g transform={`translate(36 28) scale(${zoom})`}>
                {walls.map(w => <g key={w.id} onClick={e => {e.stopPropagation();setSelected(w.id);setTool("select");setNotice(`Wand ausgewählt · ${fmt(distance(w.a,w.b))}`);}} className="wall-group">
                  <line x1={w.a.x} y1={w.a.y} x2={w.b.x} y2={w.b.y} stroke={selected === w.id ? "#b47d43" : "#35423c"} strokeWidth={selected === w.id ? 10 : 8} strokeLinecap="square"/>
                  {selected === w.id && <><circle cx={w.a.x} cy={w.a.y} r="7" fill="#fff" stroke="#b47d43" strokeWidth="3"/><circle cx={w.b.x} cy={w.b.y} r="7" fill="#fff" stroke="#b47d43" strokeWidth="3"/></>}
                  <title>{fmt(distance(w.a,w.b))}</title>
                </g>)}
                {draft && <line x1={draft.a.x} y1={draft.a.y} x2={draft.b.x} y2={draft.b.y} stroke="#b47d43" strokeWidth="5" strokeDasharray="8 6" strokeLinecap="square"/>}
              </g>
            </svg>
            {walls.length === 0 && !draft && <div className="empty-hint"><div className="hint-cross">＋</div><b>Dein Grundriss beginnt hier</b><span>Zeichne deine erste Wand auf der Arbeitsfläche.</span></div>}
            {draft && <div className="drawing-hint">Endpunkt setzen · ESC zum Abbrechen</div>}
            <div className="canvas-coordinates">SNAPPING AKTIV <span>·</span> {walls.length} WÄNDE</div>
          </div>
          <div className="statusbar"><span><i/> {notice}</span><span className="status-right">BETA · GRUNDRISS EDITOR</span></div>
        </section>

        <aside className="right-panel">
          <div className="panel-heading"><span>EIGENSCHAFTEN</span><small>{selectedWall ? "WAND" : "PROJEKT"}</small></div>
          {selectedWall ? <>
            <div className="property-card"><div className="property-icon"><BrickWall size={19}/></div><div><b>Wandabschnitt</b><small>Ausgewähltes Element</small></div></div>
            <div className="property-group"><label>LÄNGE</label><div className="value-field">{fmt(distance(selectedWall.a, selectedWall.b))}</div></div>
            <div className="property-group"><label>WANDSTÄRKE</label><div className="value-field">12 cm <span>Standard</span></div></div>
            <div className="property-group"><label>POSITION · STARTPUNKT</label><div className="coordinate-fields"><div className="value-field">X: {fmt(selectedWall.a.x)}</div><div className="value-field">Y: {fmt(selectedWall.a.y)}</div></div></div>
            <div className="panel-divider"/>
            <button className="danger-button" onClick={deleteSelected}><Trash2 size={16}/> Wand löschen</button>
            <button className="secondary-button" onClick={duplicateSelected}><Copy size={16}/> Wand duplizieren</button>
          </> : <>
            <div className="project-card"><div className="project-illustration"><div className="mini-house"><span/><i/><b/></div></div><div className="project-card-text"><b>{projectName || "Mein Haus"}</b><small>Dein Bauprojekt</small></div></div>
            <div className="stats-grid"><div><strong>{walls.length}</strong><span>Wände</span></div><div><strong>{(totalLength / 20).toFixed(1)} m</strong><span>Gesamtlänge</span></div></div>
            <div className="panel-divider"/>
            <div className="section-label">PROJEKTSTATUS</div>
            <div className="progress-row"><span>Grundriss</span><b>{walls.length ? "In Arbeit" : "Noch leer"}</b></div>
            <div className="progress-track"><span style={{width: `${Math.min(100, walls.length * 8)}%`}}/></div>
            <p className="muted-copy">Deine Änderungen werden automatisch während der Sitzung übernommen. Nutze „Speichern“, um den aktuellen Stand lokal in diesem Browser abzulegen.</p>
          </>}
          <div className="right-bottom"><div className="help-badge">i</div><p>Wähle eine Wand aus, um ihre Eigenschaften anzuzeigen.</p></div>
        </aside>
      </main>
      <footer className="footer"><span>HAUSPLANER <b>·</b> VERSION 0.1</span><span>ENTWURFSWERKZEUG <b>·</b> 2D</span></footer>
    </div>
  );
}

export default App;
