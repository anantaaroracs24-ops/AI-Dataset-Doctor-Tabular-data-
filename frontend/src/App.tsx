import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Info,
  LayoutDashboard,
  Menu,
  Network,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Table2,
  UploadCloud,
  X,
  Zap
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  analyzeOverview,
  discoverClusters,
  downloadTreatedDataset,
  loadCorrelations,
  treatDataset
} from "./services/api";
import type {
  ClusterProfile,
  ClusteringResponse,
  CorrelationResponse,
  OverviewResponse,
  PageKey,
  Recommendation,
  TreatmentResponse
} from "./types";

const navItems: Array<{ key: PageKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "dataset", label: "Dataset", icon: Database },
  { key: "diagnosis", label: "Diagnosis", icon: ClipboardCheck },
  { key: "patterns", label: "Pattern Discovery", icon: Network },
  { key: "prescription", label: "AI Prescription", icon: FileText }
];

const scanStages = [
  "Reading dataset",
  "Examining columns",
  "Checking data quality",
  "Detecting anomalies",
  "Analyzing relationships",
  "Discovering patterns",
  "Preparing diagnosis"
];

const clusterColors = ["#2f80ed", "#27ae60", "#f2c94c", "#eb5757", "#8b5cf6", "#0ea5a4"];

function healthLabel(score: number) {
  if (score >= 90) return { label: "Excellent", tone: "success" };
  if (score >= 75) return { label: "Healthy with minor issues", tone: "info" };
  if (score >= 50) return { label: "Needs attention", tone: "warning" };
  return { label: "Critical", tone: "danger" };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function fileExtension(name: string) {
  return name.split(".").pop()?.toUpperCase() ?? "FILE";
}

function getMissingTotal(data: OverviewResponse) {
  return data.quality.missing_values.reduce((total, item) => total + item.missing_count, 0);
}

function getOutlierTotal(data: OverviewResponse) {
  return Object.values(data.outliers).reduce((total, item) => total + item.outlier_count, 0);
}

function App() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [file, setFile] = useState<File | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [clustering, setClustering] = useState<ClusteringResponse | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationResponse | null>(null);
  const [treatment, setTreatment] = useState<TreatmentResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadingKind, setLoadingKind] = useState<"analysis" | "treatment">("analysis");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigate = (nextPage: PageKey) => {
    setPage(nextPage);
    setMobileNavOpen(false);
  };

  const analyze = async (nextFile: File) => {
    setFile(nextFile);
    setTreatment(null);
    setLoadingKind("analysis");
    setStatus("loading");
    setProgress(8);
    setError("");
    try {
      const result = await analyzeOverview(nextFile, 3, (value) => {
        setProgress((current) => Math.max(current, Math.min(value, 92)));
      });
      setOverview(result);
      setClustering(result.clustering ?? null);
      setCorrelations(result.correlations ?? null);
      setProgress(100);
      setStatus("success");
      navigate("dashboard");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Dataset Doctor couldn't reach the analysis engine."
      );
    }
  };

  const discover = async (nClusters: number) => {
    if (!file) return;
    setLoadingKind("analysis");
    setStatus("loading");
    setProgress(12);
    setError("");
    try {
      const result = await discoverClusters(file, nClusters, (value) => {
        setProgress((current) => Math.max(current, Math.min(value, 92)));
      });
      setClustering(result);
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The pattern discovery engine could not complete this check."
      );
    }
  };

  const refreshCorrelations = async () => {
    if (!file) return;
    setLoadingKind("analysis");
    setStatus("loading");
    setProgress(15);
    setError("");
    try {
      const result = await loadCorrelations(file, (value) => {
        setProgress((current) => Math.max(current, Math.min(value, 92)));
      });
      setCorrelations(result);
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The relationship analysis could not be completed."
      );
    }
  };

  const applyTreatment = async () => {
    if (!file) {
      setError("Upload a dataset before applying treatment.");
      return;
    }

    setLoadingKind("treatment");
    setStatus("loading");
    setProgress(8);
    setError("");
    try {
      const result = await treatDataset(file, {}, (value) => {
        setProgress((current) => Math.max(current, Math.min(value, 92)));
      });
      setTreatment(result);
      setProgress(100);
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Dataset Doctor couldn't complete the treatment. Please try again."
      );
    }
  };

  const downloadTreatment = async () => {
    if (!treatment) return;
    try {
      await downloadTreatedDataset(treatment.download_url);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Dataset Doctor couldn't download the treated dataset."
      );
      setStatus("error");
    }
  };

  const dismissError = () => {
    setError("");
    if (status === "error") setStatus(overview ? "success" : "idle");
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={navigate} hasOverview={Boolean(overview)} hasTreatment={Boolean(treatment)} />
      <div className="mobile-header">
        <BrandMark compact />
        <button
          className="icon-button"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>
      {mobileNavOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)}>
          <aside className="mobile-nav" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-nav-top">
              <BrandMark />
              <button
                className="icon-button"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks activePage={page} onNavigate={navigate} />
          </aside>
        </div>
      )}
      <main className="main-content">
        <Topbar overview={overview} onUpload={analyze} />
        {error && <ErrorBanner message={error} onDismiss={dismissError} />}

        {page === "dashboard" && (
          <Dashboard
            overview={overview}
            status={status}
            progress={progress}
            onUpload={analyze}
            onNavigate={navigate}
          />
        )}
        {page === "dataset" && (
          <DatasetPage overview={overview} onUpload={analyze} onNavigate={navigate} />
        )}
        {page === "diagnosis" && (
          <DiagnosisPage overview={overview} onUpload={analyze} onNavigate={navigate} />
        )}
        {page === "patterns" && (
          <PatternsPage
            overview={overview}
            clustering={clustering}
            correlations={correlations}
            onUpload={analyze}
            onDiscover={discover}
            onRefreshCorrelations={refreshCorrelations}
            onNavigate={navigate}
            busy={status === "loading"}
          />
        )}
        {page === "prescription" && (
          <PrescriptionPage
            overview={overview}
            treatment={treatment}
            onUpload={analyze}
            onTreat={applyTreatment}
            onDownload={downloadTreatment}
            onNavigate={navigate}
            busy={status === "loading"}
          />
        )}
      </main>
      {status === "loading" && <ScanOverlay progress={progress} kind={loadingKind} />}
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark-compact" : ""}`}>
      <div className="brand-icon">
        <Stethoscope size={compact ? 19 : 22} strokeWidth={2.3} />
        <span className="brand-pulse" />
      </div>
      {!compact && (
        <div>
          <strong>Dataset Doctor</strong>
          <span>Intelligent data checkups</span>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  activePage,
  onNavigate
}: {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <aside className="sidebar">
      <BrandMark />
      <div className="sidebar-label">Workspace</div>
      <NavLinks activePage={activePage} onNavigate={onNavigate} />
      <div className="sidebar-bottom">
        <div className="sidebar-label">Support</div>
        <button className="nav-item nav-item-muted">
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <div className="engine-status">
          <span className="status-dot" />
          <div>
            <strong>Analysis engine</strong>
            <span>Ready for a checkup</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLinks({
  activePage,
  onNavigate
}: {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <nav className="nav-list" aria-label="Primary navigation">
      {navItems.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={`nav-item ${activePage === key ? "nav-item-active" : ""}`}
          onClick={() => onNavigate(key)}
        >
          <Icon size={18} />
          <span>{label}</span>
          {activePage === key && <ChevronRight className="nav-chevron" size={15} />}
        </button>
      ))}
    </nav>
  );
}

function Topbar({
  overview,
  onUpload
}: {
  overview: OverviewResponse | null;
  onUpload: (file: File) => void;
}) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <ChevronRight size={14} />
        <strong>{overview?.dataset.filename ?? "New checkup"}</strong>
      </div>
      <label className="topbar-upload">
        <UploadCloud size={16} />
        <span>New checkup</span>
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={(event) => {
            const nextFile = event.target.files?.[0];
            if (nextFile) onUpload(nextFile);
            event.currentTarget.value = "";
          }}
        />
      </label>
    </header>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <AlertTriangle size={19} />
      <div>
        <strong>Checkup interrupted</strong>
        <span>{message}</span>
      </div>
      <button className="icon-button" onClick={onDismiss} aria-label="Dismiss error">
        <X size={17} />
      </button>
    </div>
  );
}

function Dashboard({
  overview,
  status,
  progress,
  onUpload,
  onNavigate
}: {
  overview: OverviewResponse | null;
  status: "idle" | "loading" | "success" | "error";
  progress: number;
  onUpload: (file: File) => void;
  onNavigate: (page: PageKey) => void;
}) {
  const score = overview?.health_score ?? 0;
  const health = healthLabel(score);
  const recommendations = overview?.recommendations ?? [];
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><Activity size={14} /> Dataset checkup center</div>
          <h1>Good afternoon</h1>
          <p>Let&apos;s check the health of your dataset.</p>
        </div>
        {overview && (
          <div className="last-checkup">
            <span className="status-dot" />
            Latest checkup complete
          </div>
        )}
      </section>

      {!overview ? (
        <section className="empty-dashboard-grid">
          <UploadZone onUpload={onUpload} />
          <div className="journey-card">
            <div className="journey-card-header">
              <span className="icon-bubble icon-bubble-blue"><Sparkles size={18} /></span>
              <span className="soft-badge">How it works</span>
            </div>
            <h2>A clinical view of your data.</h2>
            <p>
              Dataset Doctor scans your file, finds what needs attention, and writes a clear
              prescription for your next modeling step.
            </p>
            <div className="journey-steps">
              {[
                ["01", "Upload", "Bring a CSV or Excel file"],
                ["02", "Examine", "Profile every column"],
                ["03", "Prescribe", "Get actions you can use"]
              ].map(([number, title, copy]) => (
                <div className="journey-step" key={number}>
                  <span>{number}</span>
                  <div><strong>{title}</strong><small>{copy}</small></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="hero-dashboard">
            <HealthCard score={score} health={health} filename={overview.dataset.filename} />
            <div className="scan-summary">
              <div className="section-kicker">Latest checkup</div>
              <h2>{overview.dataset.filename}</h2>
              <p>
                Your dataset has been examined across {overview.dataset.columns} columns and{" "}
                {formatNumber(overview.dataset.rows)} records.
              </p>
              <div className="scan-summary-stats">
                <div><span>Signals found</span><strong>{recommendations.length}</strong></div>
                <div><span>Patterns</span><strong>{overview.clustering?.available === false ? "—" : overview.clustering?.n_clusters ?? 3}</strong></div>
                <div><span>Numerical fields</span><strong>{overview.correlations?.features?.length ?? Object.keys(overview.statistics).length}</strong></div>
              </div>
              <button className="text-button" onClick={() => onNavigate("diagnosis")}>
                Review diagnosis <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
          <section className="section-block">
            <div className="section-title-row">
              <div><div className="section-kicker">At a glance</div><h2>Health indicators</h2></div>
              <button className="quiet-button" onClick={() => onNavigate("dataset")}>View dataset <ChevronRight size={15} /></button>
            </div>
            <SummaryCards overview={overview} />
          </section>
          <section className="dashboard-lower-grid">
            <RecentSignals recommendations={recommendations} onNavigate={onNavigate} />
            <QuickActions onNavigate={onNavigate} />
          </section>
        </>
      )}
      {status === "loading" && <div className="sr-only">Analysis in progress: {progress}%</div>}
    </>
  );
}

function UploadZone({ onUpload }: { onUpload: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const acceptFile = (nextFile?: File) => {
    if (!nextFile) return;
    const valid = /\.(csv|xls|xlsx)$/i.test(nextFile.name);
    if (valid) onUpload(nextFile);
  };
  return (
    <div
      className={`upload-zone ${dragging ? "upload-zone-dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }}
    >
      <div className="upload-icon-wrap"><UploadCloud size={29} /></div>
      <span className="upload-label">Start a Dataset Checkup</span>
      <h2>Upload your dataset</h2>
      <p>Let Dataset Doctor examine your file and surface what matters.</p>
      <label className="primary-button upload-button">
        <UploadCloud size={17} /> Choose file
        <input type="file" accept=".csv,.xls,.xlsx" onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }} />
      </label>
      <span className="file-support"><FileSpreadsheet size={14} /> CSV, XLS, XLSX <i>•</i> up to your workspace limit</span>
    </div>
  );
}

function HealthCard({
  score,
  health,
  filename
}: {
  score: number;
  health: { label: string; tone: string };
  filename?: string;
}) {
  return (
    <div className="health-card">
      <div className="health-card-top">
        <div><div className="section-kicker">Dataset health</div><span className="health-filename">{filename}</span></div>
        <span className={`tone-badge tone-${health.tone}`}>{health.label}</span>
      </div>
      <div className="gauge-row">
        <div className="health-gauge" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
          <div className="gauge-inner"><strong>{score}</strong><span>/ 100</span></div>
        </div>
        <div className="gauge-copy">
          <HeartPulse size={23} />
          <strong>{health.label}</strong>
          <span>{score >= 90 ? "Your dataset looks ready for the next step." : "A few signals deserve your attention before modeling."}</span>
        </div>
      </div>
      <div className="gauge-scale"><span>Critical</span><span>Needs attention</span><span>Healthy</span></div>
    </div>
  );
}

function SummaryCards({ overview }: { overview: OverviewResponse }) {
  const cards = [
    { label: "Rows", value: formatNumber(overview.dataset.rows), icon: Table2, tone: "blue" },
    { label: "Columns", value: formatNumber(overview.dataset.columns), icon: Database, tone: "blue" },
    { label: "Missing values", value: formatNumber(getMissingTotal(overview)), icon: AlertTriangle, tone: "yellow" },
    { label: "Duplicates", value: formatNumber(overview.quality.duplicate_rows), icon: CopyIcon, tone: overview.quality.duplicate_rows ? "yellow" : "green" },
    { label: "Outliers", value: formatNumber(getOutlierTotal(overview)), icon: Activity, tone: getOutlierTotal(overview) ? "red" : "green" }
  ];
  return <div className="summary-grid">{cards.map(({ label, value, icon: Icon, tone }) => (
    <div className="summary-card" key={label}>
      <div className={`summary-icon summary-icon-${tone}`}><Icon size={18} /></div>
      <span>{label}</span><strong>{value}</strong>
      <small>{label === "Rows" ? "observations" : label === "Columns" ? "features" : "detected"}</small>
    </div>
  ))}</div>;
}

function CopyIcon({ size }: { size?: number }) {
  return <FileText size={size} />;
}

function RecentSignals({
  recommendations,
  onNavigate
}: {
  recommendations: Recommendation[];
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <div className="panel">
      <div className="panel-heading"><div><div className="section-kicker">Clinical notes</div><h3>Recent signals</h3></div><button className="icon-button" onClick={() => onNavigate("diagnosis")}><ArrowUpRight size={17} /></button></div>
      {recommendations.length === 0 ? (
        <div className="inline-empty"><CheckCircle2 size={19} /><span>No significant issues detected.</span></div>
      ) : recommendations.slice(0, 3).map((recommendation, index) => (
        <RecommendationRow recommendation={recommendation} key={`${recommendation.problem}-${index}`} />
      ))}
    </div>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <div className="panel quick-actions">
      <div className="panel-heading"><div><div className="section-kicker">Continue checkup</div><h3>Explore the findings</h3></div><Zap size={18} className="panel-accent" /></div>
      <button onClick={() => onNavigate("dataset")}><span className="action-icon"><Database size={17} /></span><span><strong>Review dataset</strong><small>Columns, types, and preview</small></span><ChevronRight size={16} /></button>
      <button onClick={() => onNavigate("patterns")}><span className="action-icon"><Network size={17} /></span><span><strong>Discover patterns</strong><small>Map clusters and relationships</small></span><ChevronRight size={16} /></button>
      <button onClick={() => onNavigate("prescription")}><span className="action-icon"><FileText size={17} /></span><span><strong>Read prescription</strong><small>Turn findings into action</small></span><ChevronRight size={16} /></button>
    </div>
  );
}

function EmptyPage({
  icon: Icon,
  title,
  copy,
  onUpload
}: {
  icon: typeof Database;
  title: string;
  copy: string;
  onUpload: (file: File) => void;
}) {
  return <div className="page-empty"><div className="empty-icon"><Icon size={25} /></div><h2>{title}</h2><p>{copy}</p><UploadZone onUpload={onUpload} /></div>;
}

function DatasetPage({
  overview,
  onUpload,
  onNavigate
}: {
  overview: OverviewResponse | null;
  onUpload: (file: File) => void;
  onNavigate: (page: PageKey) => void;
}) {
  const [search, setSearch] = useState("");
  if (!overview) return <EmptyPage icon={Database} title="Your dataset is waiting" copy="Upload a CSV or Excel file to see its profile, schema, and preview." onUpload={onUpload} />;
  const { dataset, quality, preview } = overview;
  const missingByColumn = new Map(quality.missing_values.map((item) => [item.column, item]));
  const columns = quality.data_types.filter((item) => item.column.toLowerCase().includes(search.toLowerCase()));
  const previewColumns = dataset.column_names;
  return (
    <>
      <PageIntro eyebrow="Dataset profile" title="Your dataset" subtitle="A clear view of the structure Dataset Doctor examined." action={<button className="quiet-button" onClick={() => onNavigate("diagnosis")}>Next: diagnosis <ChevronRight size={15} /></button>} />
      <div className="profile-strip">
        <div className="file-tile"><FileSpreadsheet size={22} /><div><strong>{dataset.filename}</strong><span>{fileExtension(dataset.filename ?? "csv")} file</span></div></div>
        <ProfileMetric label="Rows" value={formatNumber(dataset.rows)} />
        <ProfileMetric label="Columns" value={formatNumber(dataset.columns)} />
        <ProfileMetric label="Memory used" value={`${dataset.memory_usage_mb} MB`} />
      </div>
      <section className="panel">
        <div className="panel-heading"><div><div className="section-kicker">Schema</div><h3>Column health</h3></div><div className="table-count">{columns.length} of {quality.data_types.length} columns</div></div>
        <div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search columns..." /></div>
        <div className="table-scroll"><table><thead><tr><th>Column name</th><th>Data type</th><th>Unique values</th><th>Missing</th><th>Status</th></tr></thead><tbody>{columns.map((column) => {
          const missing = missingByColumn.get(column.column);
          const hasMissing = Boolean(missing?.missing_count);
          return <tr key={column.column}><td><strong>{column.column}</strong></td><td><span className="type-pill">{column.dtype}</span></td><td>{formatNumber(column.unique_values)}</td><td>{missing?.missing_count ?? 0} <span className="muted">({missing?.missing_percentage ?? 0}%)</span></td><td><span className={`table-status ${hasMissing ? "table-status-warning" : "table-status-good"}`}>{hasMissing ? "Review" : "Clear"}</span></td></tr>;
        })}</tbody></table></div>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><div className="section-kicker">Sample records</div><h3>Dataset preview</h3></div><span className="soft-badge">First {preview.length} rows</span></div>
        <div className="table-scroll"><table className="preview-table"><thead><tr>{previewColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{preview.map((row, index) => <tr key={index}>{previewColumns.map((column) => <td key={column}>{formatCell(row[column])}</td>)}</tr>)}</tbody></table></div>
      </section>
    </>
  );
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return <div className="profile-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function DiagnosisPage({
  overview,
  onUpload,
  onNavigate
}: {
  overview: OverviewResponse | null;
  onUpload: (file: File) => void;
  onNavigate: (page: PageKey) => void;
}) {
  if (!overview) return <EmptyPage icon={ClipboardCheck} title="No diagnosis yet" copy="Start a dataset checkup to receive clinical-style findings." onUpload={onUpload} />;
  const health = healthLabel(overview.health_score);
  return (
    <>
      <PageIntro eyebrow="Clinical findings" title="Dataset Diagnosis" subtitle="Here&apos;s what Dataset Doctor found." action={<button className="quiet-button" onClick={() => onNavigate("prescription")}>View prescription <ChevronRight size={15} /></button>} />
      <div className="diagnosis-banner"><div className={`diagnosis-banner-icon tone-${health.tone}`}><HeartPulse size={24} /></div><div><span>Overall assessment</span><strong>{health.label}</strong><p>Health score {overview.health_score} out of 100 for {overview.dataset.filename}.</p></div><div className="diagnosis-score">{overview.health_score}<small>/100</small></div></div>
      {overview.recommendations.length === 0 ? (
        <div className="healthy-state"><div className="healthy-check"><ShieldCheck size={27} /></div><h2>No significant issues detected</h2><p>The essential quality signals are clear. Your dataset is ready for the next step.</p></div>
      ) : (
        <div className="diagnosis-list">{overview.recommendations.map((recommendation, index) => <DiagnosisCard recommendation={recommendation} index={index} key={`${recommendation.problem}-${index}`} />)}</div>
      )}
    </>
  );
}

function RecommendationRow({ recommendation }: { recommendation: Recommendation }) {
  const severity = recommendation.severity === "high" ? "danger" : recommendation.severity === "medium" ? "warning" : "info";
  return <div className="recommendation-row"><span className={`severity-dot severity-${severity}`} /><div><strong>{recommendation.problem}</strong><span>{recommendation.column ? `in ${recommendation.column}` : "Across the dataset"}</span></div><span className={`severity-label severity-label-${severity}`}>{recommendation.severity}</span></div>;
}

function DiagnosisCard({ recommendation, index }: { recommendation: Recommendation; index: number }) {
  const severity = recommendation.severity === "high" ? "danger" : recommendation.severity === "medium" ? "warning" : "info";
  const Icon = severity === "danger" ? AlertTriangle : severity === "warning" ? AlertTriangle : Info;
  return <article className={`diagnosis-card diagnosis-card-${severity}`}><div className={`diagnosis-icon diagnosis-icon-${severity}`}><Icon size={20} /></div><div className="diagnosis-card-body"><div className="diagnosis-card-meta"><span>Finding {String(index + 1).padStart(2, "0")}</span><span className={`severity-label severity-label-${severity}`}>{recommendation.severity}</span></div><h3>{recommendation.problem}</h3><p className="affected-column">{recommendation.column ? `Affected column: ${recommendation.column}` : "Affected area: dataset-wide"}</p><div className="treatment"><span>Treatment</span><p>{recommendation.recommendation}</p></div></div></article>;
}

function PatternsPage({
  overview,
  clustering,
  correlations,
  onUpload,
  onDiscover,
  onRefreshCorrelations,
  onNavigate,
  busy
}: {
  overview: OverviewResponse | null;
  clustering: ClusteringResponse | null;
  correlations: CorrelationResponse | null;
  onUpload: (file: File) => void;
  onDiscover: (clusters: number) => void;
  onRefreshCorrelations: () => void;
  onNavigate: (page: PageKey) => void;
  busy: boolean;
}) {
  const [nClusters, setNClusters] = useState(3);
  if (!overview) return <EmptyPage icon={Network} title="Patterns are waiting" copy="Upload a dataset with at least two numerical columns to discover hidden patterns." onUpload={onUpload} />;
  const points = clustering?.pca?.points ?? [];
  const counts = clustering?.cluster_counts ?? {};
  const relationshipData = correlations?.correlations ?? overview.correlations?.correlations ?? [];
  return (
    <>
      <PageIntro eyebrow="AI discovery lab" title="Pattern Discovery" subtitle="Find the natural groups and relationships inside your dataset." action={<button className="quiet-button" onClick={() => onNavigate("prescription")}>Finish with prescription <ChevronRight size={15} /></button>} />
      <section className="pattern-control panel"><div className="pattern-control-copy"><div className="icon-bubble icon-bubble-blue"><Network size={18} /></div><div><h3>Discover distinct patterns</h3><p>Dataset Doctor uses K-Means and PCA to map the shape of your data.</p></div></div><div className="cluster-control"><label htmlFor="cluster-count">Number of clusters</label><select id="cluster-count" value={nClusters} onChange={(event) => setNClusters(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option value={value} key={value}>{value} clusters</option>)}</select><button className="primary-button" onClick={() => onDiscover(nClusters)} disabled={busy}>{busy ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />} Discover patterns</button></div></section>
      {clustering?.available === false || clustering?.message ? <div className="notice-card"><Info size={18} /><span>{clustering.message ?? "Pattern discovery is not available for this dataset."}</span></div> : (
        <section className="pattern-grid">
          <div className="panel chart-panel"><div className="panel-heading"><div><div className="section-kicker">PCA projection</div><h3>Your dataset map</h3></div><span className="soft-badge">{points.length} points</span></div><div className="chart-wrap">{points.length ? <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 18, bottom: 16, left: -15 }}><CartesianGrid strokeDasharray="3 3" stroke="#e4eef8" /><XAxis type="number" dataKey="x" name="PC1" tick={{ fill: "#7890a6", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="number" dataKey="y" name="PC2" tick={{ fill: "#7890a6", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ strokeDasharray: "3 3" }} content={<ScatterTooltip />} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, color: "#5c738c" }} /><Scatter name="Clusters" data={points} fill="#2f80ed">{points.map((point, index) => <Cell key={index} fill={clusterColors[point.cluster % clusterColors.length]} />)}</Scatter></ScatterChart></ResponsiveContainer> : <ChartEmpty />}</div>{clustering?.pca?.explained_variance && <div className="variance-row"><span><strong>PC1</strong> {clustering.pca.explained_variance.pc1}% explained</span><span><strong>PC2</strong> {clustering.pca.explained_variance.pc2}% explained</span><span><strong>{Object.keys(counts).length || nClusters}</strong> distinct patterns</span></div>}</div>
          <div className="panel"><div className="panel-heading"><div><div className="section-kicker">Cluster census</div><h3>Pattern sizes</h3></div><BarChart3 size={18} className="panel-accent" /></div><div className="cluster-list">{Object.entries(counts).map(([cluster, count]) => <div className="cluster-row" key={cluster}><span className="cluster-swatch" style={{ background: clusterColors[Number(cluster) % clusterColors.length] }} /><div><strong>Pattern {Number(cluster) + 1}</strong><small>{Math.round((count / overview.dataset.rows) * 100)}% of records</small></div><b>{formatNumber(count)}</b></div>)}</div>{!Object.keys(counts).length && <div className="inline-empty"><Info size={18} /><span>Run discovery to see cluster sizes.</span></div>}</div>
        </section>
      )}
      <section className="panel correlations-panel"><div className="panel-heading"><div><div className="section-kicker">Relationship scan</div><h3>Strongest correlations</h3></div><button className="quiet-button" onClick={onRefreshCorrelations} disabled={busy}><RefreshCw size={14} className={busy ? "spin" : ""} /> Refresh</button></div>{relationshipData.length ? <div className="correlation-list">{relationshipData.slice(0, 8).map((relationship) => <div className="correlation-row" key={`${relationship.feature_1}-${relationship.feature_2}`}><div className="relationship-names"><strong>{relationship.feature_1}</strong><span>↔</span><strong>{relationship.feature_2}</strong></div><div className="correlation-track"><span style={{ width: `${Math.abs(relationship.correlation) * 100}%`, background: relationship.correlation >= 0 ? "#2f80ed" : "#eb5757" }} /></div><span className={`correlation-value ${relationship.correlation >= 0 ? "positive" : "negative"}`}>{relationship.correlation > 0 ? "+" : ""}{relationship.correlation.toFixed(2)}</span><span className="soft-badge">{relationship.strength}</span></div>)}</div> : <div className="inline-empty"><Info size={18} /><span>{correlations?.message ?? "At least two numerical columns are required for relationship analysis."}</span></div>}</section>
    </>
  );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { x: number; y: number; cluster: number } }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="chart-tooltip"><strong>Pattern {point.cluster + 1}</strong><span>PC1 {point.x.toFixed(2)}</span><span>PC2 {point.y.toFixed(2)}</span></div>;
}

function ChartEmpty() {
  return <div className="chart-empty"><Network size={24} /><span>Run pattern discovery to map your dataset.</span></div>;
}

function PrescriptionPage({
  overview,
  onUpload,
  onNavigate
}: {
  overview: OverviewResponse | null;
  onUpload: (file: File) => void;
  onNavigate: (page: PageKey) => void;
}) {
  if (!overview) return <EmptyPage icon={FileText} title="No prescription yet" copy="Complete a dataset checkup to receive your tailored data treatment plan." onUpload={onUpload} />;
  const health = healthLabel(overview.health_score);
  const exportPrescription = () => {
    const lines = [
      "AI DATASET DOCTOR — PRESCRIPTION",
      `Patient: ${overview.dataset.filename}`,
      `Diagnosis: ${health.label} (${overview.health_score}/100)`,
      "",
      ...overview.recommendations.map((item, index) => `${String(index + 1).padStart(2, "0")}. ${item.problem}${item.column ? ` in ${item.column}` : ""}\nTreatment: ${item.recommendation}`)
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${overview.dataset.filename?.replace(/\.[^.]+$/, "") ?? "dataset"}-prescription.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageIntro eyebrow="Your treatment plan" title="AI Prescription" subtitle="A practical plan for the next step in your dataset&apos;s journey." action={<button className="primary-button" onClick={exportPrescription}><Download size={16} /> Export prescription</button>} />
      <section className="prescription-sheet">
        <div className="prescription-topline"><div className="prescription-brand"><div className="prescription-cross"><PlusIcon /></div><div><strong>DATASET DOCTOR</strong><span>Clinical data intelligence</span></div></div><div className="prescription-date">CHECKUP REPORT <strong>#{overview.health_score.toString().padStart(3, "0")}</strong></div></div>
        <div className="prescription-rule" />
        <div className="prescription-patient"><div><span>Patient / dataset</span><strong>{overview.dataset.filename}</strong></div><div><span>Diagnosis</span><strong className={`prescription-diagnosis prescription-${health.tone}`}>{health.label}</strong></div><div><span>Health score</span><strong>{overview.health_score} <small>/ 100</small></strong></div></div>
        <div className="prescription-heading"><span>Rx</span><div><h2>Recommended treatment</h2><p>Review these signals before your next modeling or reporting step.</p></div></div>
        {overview.recommendations.length ? <div className="prescription-list">{overview.recommendations.map((item, index) => <div className="prescription-item" key={`${item.problem}-${index}`}><span className="prescription-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.problem}{item.column && <em> / {item.column}</em>}</h3><span>Treatment</span><p>{item.recommendation}</p></div></div>)}</div> : <div className="prescription-clear"><CheckCircle2 size={23} /><div><strong>No treatment required</strong><p>Your checkup found no significant quality issues.</p></div></div>}
        <div className="prescription-footer"><span><Stethoscope size={15} /> Diagnosed by Dataset Doctor</span><button className="text-button" onClick={() => onNavigate("dashboard")}>Back to checkup <ArrowUpRight size={15} /></button></div>
      </section>
    </>
  );
}

function PageIntro({
  eyebrow,
  title,
  subtitle,
  action
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return <section className="page-heading page-heading-inner"><div><div className="eyebrow"><Sparkles size={14} /> {eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</section>;
}

function ScanOverlay({ progress }: { progress: number }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setStage((current) => Math.min(current + 1, scanStages.length - 1)), 920);
    return () => window.clearInterval(interval);
  }, []);
  return <div className="scan-overlay"><div className="scan-modal"><div className="scan-orbit"><div className="scan-orbit-core"><Stethoscope size={30} /></div><span /><span /><span /></div><div className="scan-copy"><span className="section-kicker">AI medical scan</span><h2>Examining your dataset</h2><p>{scanStages[stage]}<span className="ellipsis">...</span></p></div><div className="scan-progress"><div><span>Checkup in progress</span><strong>{Math.max(progress, 8)}%</strong></div><div className="progress-track"><span style={{ width: `${Math.max(progress, 8)}%` }} /></div></div><div className="scan-stage-list">{scanStages.map((label, index) => <span className={index < stage ? "stage-done" : index === stage ? "stage-active" : ""} key={label}>{index < stage ? <CheckCircle2 size={13} /> : <span className="stage-number">{index + 1}</span>}{label}</span>)}</div></div></div>;
}

function PlusIcon() {
  return <span className="plus-icon"><span /><i /></span>;
}

export default App;