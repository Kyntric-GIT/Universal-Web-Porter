
import { useRef, useState } from "react";
import { analyzeGameFile, type AnalysisResult } from "./lib/analyzer";
import {
  Activity, Archive, ArrowUpRight, CheckCircle2,
  ChevronRight, CircleHelp, CloudUpload, Cpu, File,
  FileCode2, FolderOpen, Gamepad2, HardDrive,
  LayoutDashboard, Play, Plus, Search, Settings,
  ShieldCheck, Sparkles, Upload, X
} from "lucide-react";

type GameFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  status: string;
  platform: string;
  analysis: AnalysisResult;
};

type Page =
  | "Dashboard"
  | "Import Game"
  | "My Games"
  | "Compatibility"
  | "Browser Player"
  | "Settings";

const navigation: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Import Game", icon: CloudUpload },
  { name: "My Games", icon: Gamepad2 },
  { name: "Compatibility", icon: Activity },
  { name: "Browser Player", icon: Play },
  { name: "Settings", icon: Settings }
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [games, setGames] = useState<GameFile[]>([]);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function importFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const imported = await Promise.all(
      Array.from(fileList).map(async file => {
        const analysis = await analyzeGameFile(file);

        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: analysis.detectedFormat,
          status: analysis.compatibility,
          platform: analysis.engine,
          analysis
        };
      })
    );

    setGames(previous => [...previous, ...imported]);
    setMessage(`${imported.length} file(s) analyzed.`);
    setPage("My Games");
  }

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Imported Files", value: games.length, icon: Archive },
    {
      label: "Browser Formats",
      value: games.filter(g => g.analysis.compatibility === "Browser-ready candidate").length,
      icon: FileCode2
    },
    {
      label: "Needs Porting",
      value: games.filter(g => g.analysis.compatibility === "Requires porting").length,
      icon: Activity
    },
    {
      label: "Total Storage",
      value: formatSize(games.reduce((sum, g) => sum + g.size, 0)),
      icon: HardDrive
    }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Gamepad2 size={23} /></div>
          <div>
            <strong>UNIVERSAL</strong>
            <span>WEB-PORTER</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={`nav-item ${page === item.name ? "active" : ""}`}
                onClick={() => setPage(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
                {page === item.name && <ChevronRight size={15} className="nav-arrow" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="storage-card">
            <div className="storage-icon"><ShieldCheck size={18} /></div>
            <strong>Browser-first</strong>
            <p>Games are analyzed locally. Native executables are never launched directly.</p>
          </div>
          <div className="sidebar-version">UNIVERSAL WEB-PORTER · v0.1.0</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            PORTER <ChevronRight size={13} /> <strong>{page.toUpperCase()}</strong>
          </div>
          <div className="topbar-right">
            <span className="online-indicator"><span /> LOCAL WORKSPACE</span>
            <button className="icon-button" title="Help"><CircleHelp size={19} /></button>
            <button className="avatar">U</button>
          </div>
        </header>

        <div className="content">
          {message && (
            <div className="notice">
              <CheckCircle2 size={17} />
              {message}
              <button onClick={() => setMessage("")}><X size={16} /></button>
            </div>
          )}

          {page === "Dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><Sparkles size={14} /> GAME COMPATIBILITY PLATFORM</div>
                  <h1>Game <span>Porter</span></h1>
                  <p>Bring your games to the browser. Analyze, prepare, and play.</p>
                </div>
                <button className="primary-button" onClick={() => setPage("Import Game")}>
                  <Plus size={17} /> Import Game
                </button>
              </div>

              <div className="stats-grid">
                {stats.map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div className="stat-card" key={stat.label}>
                      <div className="stat-top"><span>{stat.label}</span><Icon size={19} /></div>
                      <strong>{stat.value}</strong>
                      <span className="stat-caption">Current workspace</span>
                    </div>
                  );
                })}
              </div>

              <section className="section">
                <div className="section-heading">
                  <div><h2>Import a game</h2><p>Start with a game file or archive.</p></div>
                  <button className="text-button" onClick={() => setPage("Import Game")}>
                    Open importer <ArrowUpRight size={15} />
                  </button>
                </div>

                <div
                  className={`drop-zone ${dragging ? "dragging" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragging(false);
                    importFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInput.current?.click()}
                >
                  <div className="upload-icon"><CloudUpload size={29} /></div>
                  <h3>Drop your game files here</h3>
                  <p>Or click to browse your device</p>
                  <span className="format-label">EXE · ZIP · WASM · HTML · PCK · PAK · GLB · MORE</span>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    hidden
                    onChange={e => importFiles(e.target.files)}
                  />
                </div>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div><h2>Recently imported</h2><p>Your latest game files.</p></div>
                  <button className="text-button" onClick={() => setPage("My Games")}>
                    View library <ArrowUpRight size={15} />
                  </button>
                </div>

                {games.length === 0 ? (
                  <div className="empty-state">
                    <FolderOpen size={28} />
                    <strong>No games imported yet</strong>
                    <p>Import a game to start building your library.</p>
                  </div>
                ) : (
                  <div className="game-list">
                    {games.slice(-4).reverse().map(game => (
                      <GameRow key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {page === "Import Game" && (
            <div className="page-heading import-page">
              <div>
                <div className="eyebrow"><CloudUpload size={14} /> GAME IMPORT</div>
                <h1>Import <span>Game</span></h1>
                <p>Select game files to begin compatibility analysis.</p>
              </div>

              <div
                className="drop-zone large-drop"
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragging(false);
                  importFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInput.current?.click()}
              >
                <div className="upload-icon"><Upload size={32} /></div>
                <h3>Choose your game files</h3>
                <p>Drag and drop files here or browse your device.</p>
                <span className="format-label">MULTIPLE FILES SUPPORTED</span>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  hidden
                  onChange={e => importFiles(e.target.files)}
                />
              </div>

              <div className="info-panel">
                <ShieldCheck size={20} />
                <div>
                  <strong>Safe file handling</strong>
                  <p>Files are selected for analysis, not automatically executed. Browser compatibility must be verified before running a game.</p>
                </div>
              </div>
            </div>
          )}

          {page === "My Games" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><Archive size={14} /> YOUR LIBRARY</div>
                  <h1>My <span>Games</span></h1>
                  <p>Manage your imported game files.</p>
                </div>
                <button className="primary-button" onClick={() => setPage("Import Game")}>
                  <Plus size={17} /> Import Game
                </button>
              </div>

              <div className="search-bar">
                <Search size={18} />
                <input
                  placeholder="Search imported files..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {filteredGames.length === 0 ? (
                <div className="empty-state">
                  <FolderOpen size={28} />
                  <strong>{games.length ? "No matching files" : "Your library is empty"}</strong>
                  <p>Import files to see them here.</p>
                </div>
              ) : (
                <div className="game-list">
                  {filteredGames.map(game => (
                    <GameRow
                      key={game.id}
                      game={game}
                      onRemove={() => setGames(old => old.filter(g => g.id !== game.id))}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {page === "Compatibility" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><Activity size={14} /> DIAGNOSTICS</div>
                  <h1>Compatibility <span>Center</span></h1>
                  <p>Review detected formats and browser runtime requirements.</p>
                </div>
              </div>

              <div className="info-panel">
                <Cpu size={22} />
                <div>
                  <strong>Compatibility analyzer v0.1</strong>
                  <p>Currently performs basic file-extension identification. Deeper file inspection and runtime verification are coming next.</p>
                </div>
              </div>

              {games.length === 0 ? (
                <div className="empty-state">
                  <Activity size={28} />
                  <strong>No files to analyze</strong>
                  <p>Import a game to view its detected format.</p>
                </div>
              ) : (
                <div className="game-list">
                  {games.map(game => <GameRow key={game.id} game={game} />)}
                </div>
              )}
            </>
          )}

          {page === "Browser Player" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><Play size={14} /> GAME RUNTIME</div>
                  <h1>Browser <span>Player</span></h1>
                  <p>Play games supported by compatible browser runtimes.</p>
                </div>
              </div>

              <div className="player-placeholder">
                <div className="player-icon"><Gamepad2 size={42} /></div>
                <h2>Player workspace</h2>
                <p>No compatible game runtime is connected yet.</p>
                <span>WASM AND HTML5 RUNTIMES COMING NEXT</span>
              </div>
            </>
          )}

          {page === "Settings" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><Settings size={14} /> PREFERENCES</div>
                  <h1>Porter <span>Settings</span></h1>
                  <p>Application information and workspace preferences.</p>
                </div>
              </div>

              <div className="settings-card">
                <strong>Application</strong>
                <div><span>Version</span><b>0.1.0</b></div>
                <div><span>Frontend</span><b>React + TypeScript</b></div>
                <div><span>Graphics</span><b>Three.js</b></div>
                <div><span>Execution target</span><b>WebAssembly / Browser</b></div>
              </div>

              <div className="settings-card">
                <strong>Workspace</strong>
                <div><span>Imported files</span><b>{games.length}</b></div>
                <div>
                  <span>Storage used by imported files</span>
                  <b>{formatSize(games.reduce((sum, g) => sum + g.size, 0))}</b>
                </div>
                <div><span>Storage persistence</span><b>Session only (initial version)</b></div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function GameRow({
  game,
  onRemove
}: {
  game: GameFile;
  onRemove?: () => void;
}) {
  return (
    <div className="game-row">
      <div className="file-icon"><File size={21} /></div>

      <div className="game-info">
        <strong>{game.name}</strong>
        <span>{game.type} · {formatSize(game.size)}</span>
        <span>Engine: {game.analysis.engine}</span>
        <span>{game.analysis.explanation}</span>
        <span>Next: {game.analysis.recommendation}</span>
      </div>

      <div className="game-platform">{game.platform}</div>
      <span className="status-label">{game.status}</span>

      {onRemove && (
        <button
          className="remove-button"
          title="Remove file"
          onClick={onRemove}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}