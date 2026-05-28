"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/config/axios";
import {
  Fish, Layers, Plus, RefreshCw, ChevronRight,
  Droplets, TrendingUp, TrendingDown, Package,
  AlertTriangle, CheckCircle, Clock, DollarSign,
  Utensils, Skull, ShoppingBag, Wrench, X,
  BarChart2, Search, Grid, List, Leaf, Home, History,
  Star, Edit3, Trash2, ImagePlus, Eye,
} from "lucide-react";
import { useAuth }  from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Auth: la cookie httpOnly viaja sola con `withCredentials` (configurada en `api`).

// ── helpers ──────────────────────────────────────────────────────
const fmtBs  = (n) => `${Math.round(n || 0).toLocaleString("es-BO")} Bs`;
const fmtKg  = (n) => `${(n || 0).toFixed(1)} kg`;
const fmtNum = (n) => (n || 0).toLocaleString("es-BO");

const ESTADO_COLOR = {
  normal:  { bg: "rgba(34,197,94,.12)",  text: "#22c55e" },
  bajo:    { bg: "rgba(245,158,11,.12)", text: "#f59e0b" },
  critico: { bg: "rgba(239,68,68,.12)",  text: "#ef4444" },
};

function estadoLaguna(pct) {
  if (pct > 30) return "normal";
  if (pct > 10) return "bajo";
  return "critico";
}

const TIPOS_MOV = [
  { key: "alimentacion", label: "Alimentación", icon: Utensils  },
  { key: "mortalidad",   label: "Mortalidad",   icon: Skull     },
  { key: "costo",        label: "Costo extra",  icon: Wrench    },
  { key: "venta",        label: "Venta (kg)",   icon: ShoppingBag },
];

// ════════════════════════════════════════════════════════════════
//  TAB: LAGUNAS
// ════════════════════════════════════════════════════════════════
function LagunaTab({ user, D, isDark }) {
  const qc = useQueryClient();

  const { data: lagunas     = [], isLoading: loadLagunas }   = useQuery({ queryKey: ["lagunas"], queryFn: () => api.get(`${API}/lagunas`).then(r => r.data?.data ?? []) });
  const { data: stockAlim   = [] }                            = useQuery({ queryKey: ["stock_alimento"], queryFn: () => api.get(`${API}/lagunas/alimento/stock`).then(r => r.data?.data ?? []) });
  const { data: especies     = [] }                           = useQuery({ queryKey: ["especies"], queryFn: () => api.get(`${API}/lagunas/especies`).then(r => r.data?.data ?? []) });

  const [selected,   setSelected]   = useState(null);
  const [detalle,    setDetalle]     = useState(null);
  const [historial,  setHistorial]   = useState([]);
  const [loadDet,    setLoadDet]     = useState(false);

  const [modal,      setModal]       = useState(null);
  const [saving,     setSaving]      = useState(false);
  const [subTab,     setSubTab]      = useState("lagunas");

  // Formularios
  const [fLaguna,  setFL] = useState({ nombre: "", capacidad_maxima: "", descripcion: "" });
  const [fSiembra, setFS] = useState({ especie_id: "", cantidad_inicial: "", peso_inicial_g: "20", peso_objetivo_g: "800", duracion_dias: "210", precio_alevines_bs: "0", precio_venta_kg_bs: "35" });
  const [fMov,     setFM] = useState({ tipo: "alimentacion", cantidad: "", descripcion: "" });
  const [fCompra,  setFC] = useState({ tipo_alimento_id: "", sacos: "", costo_por_saco: "135" });
  const [fEsp,     setFE] = useState({ nombre: "", peso_inicial_g: "20", peso_objetivo_g: "800", duracion_ciclo_dias: "210" });

  const inv = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["lagunas"] });
    qc.invalidateQueries({ queryKey: ["stock_alimento"] });
  }, [qc]);

  const cargarDetalle = async (laguna) => {
    setSelected(laguna);
    setLoadDet(true);
    setHistorial([]);
    try {
      const [rDet, rHist] = await Promise.all([
        api.get(`${API}/lagunas/${laguna.id}`),
        api.get(`${API}/lagunas/${laguna.id}/historial`),
      ]);
      setDetalle(rDet.data?.data ?? null);
      setHistorial(rHist.data?.data ?? []);
    } finally { setLoadDet(false); }
  };

  const cerrar = () => {
    setModal(null);
    setFL({ nombre: "", capacidad_maxima: "", descripcion: "" });
    setFS({ especie_id: "", cantidad_inicial: "", peso_inicial_g: "20", peso_objetivo_g: "800", duracion_dias: "210", precio_alevines_bs: "0", precio_venta_kg_bs: "35" });
    setFM({ tipo: "alimentacion", cantidad: "", descripcion: "" });
    setFC({ tipo_alimento_id: "", sacos: "", costo_por_saco: "135" });
    setFE({ nombre: "", peso_inicial_g: "20", peso_objetivo_g: "800", duracion_ciclo_dias: "210" });
  };

  const postAndRefresh = async (url, body) => {
    setSaving(true);
    try {
      await api.post(`${API}${url}`, body);
      cerrar();
      inv();
      if (selected) {
        const r = await api.get(`${API}/lagunas/${selected.id}`);
        setDetalle(r.data?.data ?? null);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Error al guardar");
    } finally { setSaving(false); }
  };

  // Estadísticas globales
  const totalPeces   = lagunas.reduce((s, l) => s + (l.produccion?.peces_actuales || 0), 0);
  const totalBiomasa = lagunas.reduce((s, l) => s + (l.produccion?.biomasaKg || 0), 0);
  const lagunaActivas= lagunas.filter(l => l.produccion).length;

  const inp = {
    background: D.card, border: `1px solid ${D.border}`, color: D.text,
    borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const sel = { ...inp, cursor: "pointer", colorScheme: isDark ? "dark" : "light" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {[{ k: "lagunas", label: "Mis Lagunas" }, { k: "alimento", label: "Stock Alimento" }].map(t => (
          <button key={t.k} onClick={() => setSubTab(t.k)}
            style={{ padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
              background: subTab === t.k ? D.primary : D.card, color: subTab === t.k ? "#fff" : D.muted }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SUB TAB: LAGUNAS ── */}
      {subTab === "lagunas" && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {[
              { icon: Droplets,  label: "Lagunas activas",  val: `${lagunaActivas} / ${lagunas.length}`, color: "#22C55E" },
              { icon: Fish,      label: "Peces en producción", val: fmtNum(totalPeces),  color: "#4ade80" },
              { icon: Layers,    label: "Biomasa total",    val: fmtKg(totalBiomasa), color: "#a78bfa" },
            ].map((s, i) => (
              <div key={i} className="np-hover" style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: s.color + "22", padding: 10, borderRadius: 10 }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: D.muted, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: D.text }}>{s.val}</div>
                </div>
              </div>
            ))}
            <button onClick={() => setModal("nueva_laguna")}
              style={{ background: D.primary + "18", border: `2px dashed ${D.primary}`, borderRadius: 12, padding: 16,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", color: D.primary, fontWeight: 600 }}>
              <Plus size={18} /> Nueva Laguna
            </button>
          </div>

          {/* Layout: lista + detalle */}
          <div style={{ display: "grid", gridTemplateColumns: selected ? "340px 1fr" : "1fr", gap: 16 }}>
            {/* Lista de lagunas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {loadLagunas ? (
                <div style={{ textAlign: "center", padding: 40, color: D.muted }}>Cargando…</div>
              ) : lagunas.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: D.muted }}>
                  <Fish size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div>No tienes lagunas registradas</div>
                </div>
              ) : (
                lagunas.map(laguna => {
                  const p = laguna.produccion;
                  const pctStock = p && laguna.capacidad_maxima
                    ? Math.round((p.peces_actuales / laguna.capacidad_maxima) * 100) : null;
                  const est = pctStock !== null ? estadoLaguna(pctStock) : null;
                  const isActive = selected?.id === laguna.id;

                  return (
                    <div key={laguna.id} className="np-hover" onClick={() => cargarDetalle(laguna)}
                      style={{ background: isActive ? D.primary + "18" : D.card,
                        border: `1px solid ${isActive ? D.primary : D.border}`,
                        borderRadius: 14, padding: 16, cursor: "pointer", transition: "all .2s" }}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: D.text }}>{laguna.nombre}</div>
                          {p && <div style={{ fontSize: 12, color: D.muted, marginTop: 2 }}>{p.especie_nombre}</div>}
                        </div>
                        {est ? (
                          <span style={{ background: ESTADO_COLOR[est].bg, color: ESTADO_COLOR[est].text,
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                            {p.peces_actuales} peces
                          </span>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); setSelected(laguna); setModal("siembra"); }}
                            style={{ background: D.primary, color: "#fff", border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                            + Siembra
                          </button>
                        )}
                      </div>

                      {p && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: D.muted, marginBottom: 4 }}>
                            <span>Día {p.dias} de {laguna.duracion_dias}</span>
                            <span style={{ fontWeight: 700, color: D.primary }}>{p.progresoPct}%</span>
                          </div>
                          <div style={{ height: 6, background: D.border, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${p.progresoPct}%`, background: D.primary, borderRadius: 3 }} />
                          </div>
                          <div style={{ marginTop: 10, background: D.primary + "11", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: D.text }}>
                              Hoy: {fmtKg(p.alimentacion.totalDiaKg)} · {p.alimentacion.tipo.nombre}
                            </div>
                            <div style={{ fontSize: 11, color: D.muted }}>
                              {fmtKg(p.alimentacion.porSesionKg)} × {p.alimentacion.tipo.frecuenciaDia} veces/día
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                            <button onClick={e => { e.stopPropagation(); setSelected(laguna); setModal("movimiento"); }}
                              style={{ flex: 1, background: D.primary + "18", border: "none", borderRadius: 8, padding: "7px 0",
                                color: D.primary, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                              + Movimiento
                            </button>
                            {p.diasRestantes === 0 && (
                              <button onClick={e => { e.stopPropagation(); setSelected(laguna); setModal("cosecha"); }}
                                style={{ flex: 1, background: "#f59e0b22", border: "none", borderRadius: 8, padding: "7px 0",
                                  color: "#f59e0b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                                Cosechar
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel de detalle */}
            {selected && (
              <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, color: D.text, fontSize: 18, fontWeight: 700 }}>{selected.nombre}</h3>
                    {selected.produccion && <p style={{ margin: "2px 0 0", color: D.muted, fontSize: 13 }}>{selected.produccion.especie_nombre}</p>}
                  </div>
                  <button onClick={() => { setSelected(null); setDetalle(null); setHistorial([]); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: D.muted }}>
                    <X size={20} />
                  </button>
                </div>

                {loadDet ? (
                  <div style={{ textAlign: "center", padding: 40, color: D.muted }}>Cargando…</div>
                ) : detalle?.financiero ? (
                  <>
                    {/* Financiero */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Financiero</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                      {[
                        { label: "Invertido hoy",     val: fmtBs(detalle.financiero.invertidoHoy),      color: "#ef4444" },
                        { label: "Ingresos reales",   val: fmtBs(detalle.financiero.totalIngresos),     color: "#22c55e" },
                        { label: "Ingreso proyectado",val: fmtBs(detalle.financiero.ingresoProyectado), color: D.primary },
                        { label: "Ganancia estimada", val: fmtBs(detalle.financiero.gananciaProyectada),
                          color: detalle.financiero.gananciaProyectada >= 0 ? "#22c55e" : "#ef4444" },
                      ].map((f, i) => (
                        <div key={i} style={{ background: D.background, borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 11, color: D.muted, marginBottom: 4 }}>{f.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: f.color }}>{f.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Plan alimento */}
                    {detalle.planAlimento?.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Plan de Alimento</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                          {detalle.planAlimento.map((fase, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "8px 10px", background: D.background, borderRadius: 8 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{fase.tipo.nombre}</div>
                                <div style={{ fontSize: 11, color: D.muted }}>Días {fase.diaInicio}–{fase.diaFin} ({fase.dias} días)</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{fase.sacos} sacos</div>
                                <div style={{ fontSize: 11, color: D.muted }}>{fmtBs(fase.costo)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Movimientos recientes */}
                    {detalle.movimientos?.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Últimos Movimientos</div>
                        {detalle.movimientos.slice(0, 8).map((m, i) => {
                          const colores = { alimentacion: D.primary, mortalidad: "#ef4444", venta: "#22c55e", costo: "#f59e0b" };
                          const iconos  = { alimentacion: Utensils, mortalidad: Skull, venta: ShoppingBag, costo: Wrench };
                          const Icon    = iconos[m.tipo] || Package;
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                              borderBottom: i < detalle.movimientos.length - 1 ? `1px solid ${D.border}` : "none" }}>
                              <div style={{ background: (colores[m.tipo] || D.primary) + "22", width: 32, height: 32,
                                borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Icon size={14} style={{ color: colores[m.tipo] || D.primary }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>
                                  {m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}
                                </div>
                                {m.descripcion && <div style={{ fontSize: 11, color: D.muted }}>{m.descripcion}</div>}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: D.text }}>{m.cantidad} {m.unidad}</div>
                                {(m.costo_bs > 0 || m.ingreso_bs > 0) && (
                                  <div style={{ fontSize: 11, color: m.ingreso_bs > 0 ? "#22c55e" : "#ef4444" }}>
                                    {m.ingreso_bs > 0 ? "+" : "-"}{fmtBs(m.ingreso_bs || m.costo_bs)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    {/* Historial de ciclos */}
                    {historial.length > 1 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 10px" }}>Historial de Ciclos</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {historial.filter(h => h.estado !== "activa").map((h, i) => (
                            <div key={i} style={{ background: D.background, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{h.especie_nombre || "Tambaqui"}</div>
                                <div style={{ fontSize: 11, color: D.muted }}>
                                  {new Date(h.fecha_siembra).toLocaleDateString("es-BO")} → {h.fecha_cosecha_estimada ? new Date(h.fecha_cosecha_estimada).toLocaleDateString("es-BO") : "—"}
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: h.estado === "cosechada" ? "#22c55e" : "#ef4444" }}>
                                  {h.estado}
                                </div>
                                <div style={{ fontSize: 11, color: D.muted }}>{h.cantidad_inicial} alevines</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : !detalle?.produccion ? (
                  <div style={{ textAlign: "center", padding: 30 }}>
                    <Fish size={40} style={{ color: D.muted, marginBottom: 12 }} />
                    <div style={{ color: D.muted, marginBottom: 16 }}>Sin siembra activa</div>
                    {historial.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 10px" }}>Ciclos anteriores</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                          {historial.map((h, i) => (
                            <div key={i} style={{ background: D.card, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${D.border}` }}>
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{h.especie_nombre || "Tambaqui"}</div>
                                <div style={{ fontSize: 11, color: D.muted }}>
                                  {new Date(h.fecha_siembra).toLocaleDateString("es-BO")} · {h.cantidad_inicial} alevines
                                </div>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, background: h.estado === "cosechada" ? "#22c55e22" : "#ef444422", color: h.estado === "cosechada" ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: 20 }}>
                                {h.estado}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <button onClick={() => setModal("siembra")}
                      style={{ background: D.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 600, cursor: "pointer" }}>
                      Iniciar Siembra
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 40, color: D.muted }}>Cargando datos…</div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SUB TAB: ALIMENTO ── */}
      {subTab === "alimento" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: D.text, fontSize: 16, fontWeight: 700 }}>Stock de Alimento</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModal("especie")}
                style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, padding: "8px 16px", color: D.text, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Leaf size={14} /> Nueva especie
              </button>
              <button onClick={() => setModal("compra")}
                style={{ background: D.primary, border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} /> Registrar compra
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
            {stockAlim.map((s, i) => {
              const sacos   = s.sacos_disponibles || 0;
              const kgTotal = sacos * (s.peso_saco_kg || 25);
              const colorFase = s.fase === "inicial" ? "#3b82f6" : s.fase === "crecimiento" ? "#22C55E" : "#f59e0b";
              return (
                <div key={i} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ background: colorFase + "22", color: colorFase, fontSize: 10, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 20, alignSelf: "flex-start", display: "inline-block",
                    textTransform: "uppercase", marginBottom: 8 }}>
                    {s.fase}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: D.text, marginBottom: 12 }}>{s.nombre}</div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: sacos === 0 ? "#ef4444" : D.text }}>{sacos}</div>
                      <div style={{ fontSize: 11, color: D.muted }}>sacos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: D.text }}>{kgTotal}</div>
                      <div style={{ fontSize: 11, color: D.muted }}>kg total</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: D.text }}>{s.costo_por_saco_bs || 135}</div>
                      <div style={{ fontSize: 11, color: D.muted }}>Bs/saco</div>
                    </div>
                  </div>
                  {sacos === 0 && (
                    <div style={{ marginTop: 8, background: "#ef444422", borderRadius: 6, padding: "4px 10px",
                      color: "#ef4444", fontSize: 11, fontWeight: 600, display: "inline-block" }}>
                      Sin stock
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════ MODALES ══════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) cerrar(); }}>
          <div style={{ background: D.background, borderRadius: 20, padding: 28, width: "100%", maxWidth: 480,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>

            {/* ── Nueva Laguna ── */}
            {modal === "nueva_laguna" && (
              <>
                <h3 style={{ margin: "0 0 20px", color: D.text }}>Nueva Laguna</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input style={inp} placeholder="Nombre de la laguna" value={fLaguna.nombre} onChange={e => setFL(f => ({ ...f, nombre: e.target.value }))} />
                  <input style={inp} type="number" placeholder="Capacidad máxima (peces)" value={fLaguna.capacidad_maxima} onChange={e => setFL(f => ({ ...f, capacidad_maxima: e.target.value }))} />
                  <textarea style={{ ...inp, height: 80, resize: "vertical" }} placeholder="Descripción (opcional)" value={fLaguna.descripcion} onChange={e => setFL(f => ({ ...f, descripcion: e.target.value }))} />
                  <ModalBtns onCancel={cerrar} onSave={() => postAndRefresh("/lagunas", { ...fLaguna, capacidad_maxima: parseInt(fLaguna.capacidad_maxima) || null })} saving={saving} D={D} />
                </div>
              </>
            )}

            {/* ── Iniciar Siembra ── */}
            {modal === "siembra" && (
              <>
                <h3 style={{ margin: "0 0 4px", color: D.text }}>Iniciar Siembra</h3>
                <p style={{ margin: "0 0 16px", color: D.muted, fontSize: 13 }}>{selected?.nombre}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: D.muted, display: "block", marginBottom: 6 }}>Especie</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {especies.map(e => (
                        <button key={e.id} onClick={() => setFS(f => ({ ...f, especie_id: String(e.id), peso_inicial_g: String(e.peso_inicial_g), peso_objetivo_g: String(e.peso_objetivo_g), duracion_dias: String(e.duracion_ciclo_dias) }))}
                          style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${fSiembra.especie_id === String(e.id) ? D.primary : D.border}`,
                            background: fSiembra.especie_id === String(e.id) ? D.primary : D.card,
                            color: fSiembra.especie_id === String(e.id) ? "#fff" : D.text, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                          {e.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input style={inp} type="number" placeholder="Cantidad de alevines" value={fSiembra.cantidad_inicial} onChange={e => setFS(f => ({ ...f, cantidad_inicial: e.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input style={inp} type="number" placeholder="Peso inicial (g)" value={fSiembra.peso_inicial_g} onChange={e => setFS(f => ({ ...f, peso_inicial_g: e.target.value }))} />
                    <input style={inp} type="number" placeholder="Peso objetivo (g)" value={fSiembra.peso_objetivo_g} onChange={e => setFS(f => ({ ...f, peso_objetivo_g: e.target.value }))} />
                  </div>
                  <input style={inp} type="number" placeholder="Duración ciclo (días)" value={fSiembra.duracion_dias} onChange={e => setFS(f => ({ ...f, duracion_dias: e.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input style={inp} type="number" placeholder="Costo alevines (Bs)" value={fSiembra.precio_alevines_bs} onChange={e => setFS(f => ({ ...f, precio_alevines_bs: e.target.value }))} />
                    <input style={inp} type="number" placeholder="Precio venta kg (Bs)" value={fSiembra.precio_venta_kg_bs} onChange={e => setFS(f => ({ ...f, precio_venta_kg_bs: e.target.value }))} />
                  </div>
                  <ModalBtns onCancel={cerrar} onSave={() => postAndRefresh(`/lagunas/${selected?.id}/siembras`, {
                    especie_id: parseInt(fSiembra.especie_id), cantidad_inicial: parseInt(fSiembra.cantidad_inicial),
                    peso_inicial_g: parseFloat(fSiembra.peso_inicial_g), peso_objetivo_g: parseFloat(fSiembra.peso_objetivo_g),
                    duracion_dias: parseInt(fSiembra.duracion_dias),
                    precio_alevines_bs: parseFloat(fSiembra.precio_alevines_bs) || 0,
                    precio_venta_kg_bs: parseFloat(fSiembra.precio_venta_kg_bs) || 35,
                    fecha_siembra: new Date().toISOString().split("T")[0],
                  })} saving={saving} D={D} labelSave="Iniciar" />
                </div>
              </>
            )}

            {/* ── Registrar Movimiento ── */}
            {modal === "movimiento" && (
              <>
                <h3 style={{ margin: "0 0 4px", color: D.text }}>Registrar Movimiento</h3>
                <p style={{ margin: "0 0 16px", color: D.muted, fontSize: 13 }}>{selected?.nombre}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {TIPOS_MOV.map(t => (
                      <button key={t.key} onClick={() => setFM(f => ({ ...f, tipo: t.key }))}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20,
                          border: `1px solid ${fMov.tipo === t.key ? D.primary : D.border}`,
                          background: fMov.tipo === t.key ? D.primary : D.card,
                          color: fMov.tipo === t.key ? "#fff" : D.text, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        <t.icon size={14} /> {t.label}
                      </button>
                    ))}
                  </div>
                  <input style={inp} type="number"
                    placeholder={fMov.tipo === "alimentacion" ? "Kg de alimento (dejar vacío = calculado automático)" : fMov.tipo === "mortalidad" ? "Peces muertos" : fMov.tipo === "costo" ? "Monto (Bs)" : "Kg vendidos"}
                    value={fMov.cantidad} onChange={e => setFM(f => ({ ...f, cantidad: e.target.value }))} />
                  <input style={inp} placeholder="Descripción (opcional)" value={fMov.descripcion} onChange={e => setFM(f => ({ ...f, descripcion: e.target.value }))} />
                  <ModalBtns onCancel={cerrar} onSave={() => postAndRefresh(`/lagunas/${selected?.id}/movimientos`, {
                    tipo: fMov.tipo, cantidad: parseFloat(fMov.cantidad) || 0, descripcion: fMov.descripcion,
                  })} saving={saving} D={D} />
                </div>
              </>
            )}

            {/* ── Cosechar ── */}
            {modal === "cosecha" && (
              <>
                <h3 style={{ margin: "0 0 4px", color: D.text }}>Cosechar</h3>
                <p style={{ margin: "0 0 16px", color: D.muted, fontSize: 13 }}>{selected?.nombre}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input style={inp} type="number" placeholder="Kg cosechados" value={fMov.cantidad} onChange={e => setFM(f => ({ ...f, cantidad: e.target.value }))} />
                  <input style={inp} placeholder="Descripción (opcional)" value={fMov.descripcion} onChange={e => setFM(f => ({ ...f, descripcion: e.target.value }))} />
                  <ModalBtns onCancel={cerrar} onSave={() => postAndRefresh(`/lagunas/${selected?.id}/cosechar`, { kg_cosechados: parseFloat(fMov.cantidad), descripcion: fMov.descripcion })} saving={saving} D={D} labelSave="Cosechar" />
                </div>
              </>
            )}

            {/* ── Compra Alimento ── */}
            {modal === "compra" && (
              <>
                <h3 style={{ margin: "0 0 16px", color: D.text }}>Registrar Compra de Sacos</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: D.muted, display: "block", marginBottom: 6 }}>Tipo de alimento</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {stockAlim.map(s => {
                        const tid = String(s.tipo_alimento_id || s.id);
                        return (
                          <button key={tid} onClick={() => setFC(f => ({ ...f, tipo_alimento_id: tid }))}
                            style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${fCompra.tipo_alimento_id === tid ? D.primary : D.border}`,
                              background: fCompra.tipo_alimento_id === tid ? D.primary : D.card,
                              color: fCompra.tipo_alimento_id === tid ? "#fff" : D.text, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                            {s.codigo}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input style={inp} type="number" placeholder="Cantidad de sacos" value={fCompra.sacos} onChange={e => setFC(f => ({ ...f, sacos: e.target.value }))} />
                  <input style={inp} type="number" placeholder="Costo por saco (Bs)" value={fCompra.costo_por_saco} onChange={e => setFC(f => ({ ...f, costo_por_saco: e.target.value }))} />
                  <ModalBtns onCancel={cerrar} onSave={() => postAndRefresh("/lagunas/alimento/compra", {
                    tipo_alimento_id: parseInt(fCompra.tipo_alimento_id),
                    sacos: parseInt(fCompra.sacos),
                    costo_por_saco: parseFloat(fCompra.costo_por_saco) || 135,
                  })} saving={saving} D={D} labelSave="Registrar" />
                </div>
              </>
            )}

            {/* ── Nueva Especie ── */}
            {modal === "especie" && (
              <>
                <h3 style={{ margin: "0 0 16px", color: D.text }}>Nueva Especie</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input style={inp} placeholder="Nombre (ej: Trucha arcoíris)" value={fEsp.nombre} onChange={e => setFE(f => ({ ...f, nombre: e.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input style={inp} type="number" placeholder="Peso inicial (g)" value={fEsp.peso_inicial_g} onChange={e => setFE(f => ({ ...f, peso_inicial_g: e.target.value }))} />
                    <input style={inp} type="number" placeholder="Peso objetivo (g)" value={fEsp.peso_objetivo_g} onChange={e => setFE(f => ({ ...f, peso_objetivo_g: e.target.value }))} />
                  </div>
                  <input style={inp} type="number" placeholder="Duración ciclo (días)" value={fEsp.duracion_ciclo_dias} onChange={e => setFE(f => ({ ...f, duracion_ciclo_dias: e.target.value }))} />
                  <ModalBtns onCancel={cerrar} onSave={() => postAndRefresh("/lagunas/especies", {
                    nombre: fEsp.nombre, peso_inicial_g: parseFloat(fEsp.peso_inicial_g),
                    peso_objetivo_g: parseFloat(fEsp.peso_objetivo_g), duracion_ciclo_dias: parseInt(fEsp.duracion_ciclo_dias),
                  })} saving={saving} D={D} />
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ── Botones de modal reutilizables ────────────────────────────────
function ModalBtns({ onCancel, onSave, saving, D, labelSave = "Guardar" }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
      <button onClick={onCancel}
        style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${D.border}`, background: "none", color: D.text, fontWeight: 600, cursor: "pointer" }}>
        Cancelar
      </button>
      <button onClick={onSave} disabled={saving}
        style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: D.primary, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Guardando…" : labelSave}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TAB: PRODUCTOS (gestión existente preservada)
// ════════════════════════════════════════════════════════════════
function ProductosTab({ user, D, isDark }) {
  const qc = useQueryClient();
  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["productos", "productor", user?.id],
    queryFn: () => api.get(`${API}/productos`, { params: { productor_id: user.id } }).then(r => r.data?.data ?? r.data ?? []),
    enabled: !!user?.id,
  });

  // Categorías reales del backend (reemplaza el categoria_id hardcoded)
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: () => api.get(`${API}/categorias`).then(r => r.data?.data ?? r.data ?? []),
    staleTime: 30 * 60 * 1000,
  });

  const [search,    setSearch]    = useState("");
  const [viewMode,  setViewMode]  = useState("grid");
  const [modal,     setModal]     = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current,   setCurrent]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ nombre: "", descripcion: "", precio: 0, stock: 0, categoria_id: "" });
  const [iaGenerando, setIaGenerando] = useState(false);
  // Galería: array de { id, url?, file?, preview }
  const [imagenes,  setImagenes]  = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  // Quick actions
  const [precioModal,  setPrecioModal]  = useState(null);
  const [ventaModal,   setVentaModal]   = useState(null);

  const inp = { background: D.card, border: `1px solid ${D.border}`, color: D.text, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["productos", "productor", user?.id] });
    qc.invalidateQueries({ queryKey: ["inv-movs"] });
  };

  // Normaliza la galería de un producto: usa p.imagenes (array) o cae a imagen única
  const galeriaDe = (p) => {
    let arr = [];
    if (Array.isArray(p?.imagenes)) arr = p.imagenes.filter(Boolean);
    else if (typeof p?.imagenes === "string") { try { arr = JSON.parse(p.imagenes).filter(Boolean); } catch { arr = []; } }
    if (arr.length === 0 && (p?.foto_principal || p?.imagen)) arr = [p.foto_principal || p.imagen];
    return arr;
  };

  const openCreate = () => {
    setIsEditing(false);
    setForm({ nombre: "", descripcion: "", precio: 0, stock: 0, categoria_id: String(categorias[0]?.id ?? "") });
    setImagenes([]);
    setModal(true);
  };
  const openEdit = (p) => {
    setIsEditing(true);
    setCurrent(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, stock: p.stock, categoria_id: String(p.categoria_id ?? "") });
    setImagenes(galeriaDe(p).map((url, i) => ({ id: `e${i}`, url, preview: url })));
    setModal(true);
  };

  // ── Galería: agregar / quitar / reordenar ──
  const addImagenes = (fileList) => {
    const files = Array.from(fileList || []).slice(0, 6 - imagenes.length);
    const nuevas = files.map((file, i) => ({
      id: `n${Date.now()}_${i}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImagenes(prev => [...prev, ...nuevas].slice(0, 6));
  };
  const quitarImagen = (id) => setImagenes(prev => prev.filter(x => x.id !== id));
  const moverImagen = (id, dir) => {
    setImagenes(prev => {
      const idx = prev.findIndex(x => x.id === id);
      if (idx < 0) return prev;
      const swap = idx + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.nombre?.trim()) { alert("El nombre es obligatorio"); return; }
    if (!form.categoria_id)   { alert("Selecciona una categoría"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // URLs ya existentes que se conservan (en su orden actual)
      const existentes = imagenes.filter(x => x.url && !x.file).map(x => x.url);
      fd.append("imagenes_existentes", JSON.stringify(existentes));
      // Archivos nuevos
      imagenes.filter(x => x.file).forEach(x => fd.append("imagenes", x.file));

      isEditing
        ? await api.put(`${API}/productos/${current.id}`, fd)
        : await api.post(`${API}/productos`, fd);
      inv();
      setModal(false);
    } catch (e) { alert(e.response?.data?.message || "Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try { await api.delete(`${API}/productos/${p.id}`); inv(); }
    catch (e) { alert("No se pudo eliminar"); }
  };

  // Toggle disponible directo desde la card
  const toggleDisponible = async (p) => {
    setTogglingId(p.id);
    try {
      await api.patch(`${API}/productos/${p.id}/disponibilidad`, { disponible: !p.disponible });
      inv();
    } catch (e) { alert(e.response?.data?.message || "No se pudo cambiar"); }
    finally { setTogglingId(null); }
  };

  const filtrados = productos.filter(p => p.nombre?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Barra de acciones */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: D.muted }} />
          <input style={{ ...inp, paddingLeft: 34 }} placeholder="Buscar producto…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
          style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, padding: "0 14px", color: D.text, cursor: "pointer" }}>
          {viewMode === "grid" ? <List size={16} /> : <Grid size={16} />}
        </button>
        <button onClick={openCreate}
          style={{ background: D.primary, border: "none", borderRadius: 8, padding: "0 18px", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, height: 38 }}>
          <Plus size={15} /> Nuevo Producto
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total productos", val: productos.length,                              color: "#22C55E" },
          { label: "Disponibles",     val: productos.filter(p => p.disponible).length,   color: "#4ade80" },
          { label: "Sin stock",       val: productos.filter(p => (p.stock || 0) === 0).length, color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: D.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: D.muted }}>Cargando productos…</div>
      ) : filtrados.length === 0 ? (
        // Empty state
        <div style={{ textAlign: "center", padding: "48px 20px", background: D.card, border: `1px dashed ${D.border}`, borderRadius: 14 }}>
          <Package size={40} style={{ color: D.muted, margin: "0 auto 12px" }} />
          <p style={{ color: D.text, fontWeight: 600, margin: "0 0 4px" }}>
            {search ? "Sin resultados" : "Aún no tienes productos"}
          </p>
          <p style={{ color: D.muted, fontSize: 13, margin: "0 0 16px" }}>
            {search ? "Prueba con otro término" : "Crea tu primer producto para empezar a vender"}
          </p>
          {!search && (
            <button onClick={openCreate}
              style={{ background: D.primary, border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> Crear producto
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: viewMode === "grid" ? "grid" : "flex", flexDirection: "column",
          gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
          {filtrados.map(p => {
            const galeria = galeriaDe(p);
            const img = galeria[0] || null;
            const stockColor = (p.stock || 0) === 0 ? "#ef4444" : (p.stock || 0) < 10 ? "#f59e0b" : "#22c55e";
            const rating = parseFloat(p.promedio_valoracion || 0);
            const nReviews = parseInt(p.total_valoraciones || 0);
            const vendidos = parseInt(p.total_vendido || 0);
            return (
              <div key={p.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden", opacity: p.disponible ? 1 : 0.7 }}>
                <div style={{ position: "relative" }}>
                  {img
                    ? <img src={img} alt={p.nombre} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: 160, background: D.border, display: "flex", alignItems: "center", justifyContent: "center" }}><Fish size={32} style={{ color: D.muted }} /></div>
                  }
                  {/* Contador de fotos */}
                  {galeria.length > 1 && (
                    <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 12, display: "flex", alignItems: "center", gap: 3 }}>
                      <ImagePlus size={10} /> {galeria.length}
                    </div>
                  )}
                  {/* Acciones */}
                  <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                    <button onClick={() => openEdit(p)} title="Editar"
                      style={{ background: "rgba(0,0,0,.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Edit3 size={13} style={{ color: "#fff" }} />
                    </button>
                    <button onClick={() => handleDelete(p)} title="Eliminar"
                      style={{ background: "rgba(239,68,68,.75)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Trash2 size={13} style={{ color: "#fff" }} />
                    </button>
                  </div>
                  {/* Toggle disponible — switch directo en la card */}
                  <button onClick={() => toggleDisponible(p)} disabled={togglingId === p.id}
                    title={p.disponible ? "Tocar para ocultar del catálogo" : "Tocar para publicar"}
                    style={{
                      position: "absolute", bottom: 8, right: 8, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 4px", borderRadius: 20,
                      background: p.disponible ? "rgba(34,197,94,.92)" : "rgba(107,114,128,.92)",
                      opacity: togglingId === p.id ? 0.6 : 1,
                    }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", display: "block" }} />
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>
                      {p.disponible ? "Visible" : "Oculto"}
                    </span>
                  </button>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: D.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: D.text, flexShrink: 0 }}>Bs {Number(p.precio || 0).toFixed(2)}</div>
                  </div>

                  {/* Métricas inline: rating + vendidos */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 11 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, color: nReviews > 0 ? "#f59e0b" : D.dim }}>
                      <Star size={12} style={{ fill: nReviews > 0 ? "#f59e0b" : "none" }} />
                      {nReviews > 0 ? `${rating.toFixed(1)} (${nReviews})` : "Sin reseñas"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, color: vendidos > 0 ? "#22c55e" : D.dim }}>
                      <ShoppingBag size={12} /> {vendidos} vendido{vendidos === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: D.muted }}>Stock</span>
                    <span style={{ fontWeight: 700, color: stockColor }}>{p.stock || 0} {p.unidad || "unidades"}</span>
                  </div>
                  <div style={{ height: 5, background: D.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, ((p.stock || 0) / 100) * 100)}%`, background: stockColor, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                    <button onClick={() => setPrecioModal(p)} title="Actualizar precio"
                      style={{ background: "rgba(34,197,94,.15)", border: "none", borderRadius: 8, padding: "7px 0", color: "#22c55e", fontWeight: 600, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <DollarSign size={12} /> Precio
                    </button>
                    <button onClick={() => setVentaModal(p)} title="Registrar venta presencial"
                      style={{ background: "rgba(139,92,246,.15)", border: "none", borderRadius: 8, padding: "7px 0", color: "#8b5cf6", fontWeight: 600, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Home size={12} /> Venta
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {precioModal && (
        <PrecioModal producto={precioModal} D={D} inp={inp}
          onClose={() => setPrecioModal(null)}
          onSaved={() => { setPrecioModal(null); inv(); }} />
      )}
      {ventaModal && (
        <VentaPresencialModal producto={ventaModal} D={D} inp={inp}
          onClose={() => setVentaModal(null)}
          onSaved={() => { setVentaModal(null); inv(); }} />
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div style={{ background: D.background, borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 16px", color: D.text }}>{isEditing ? "Editar Producto" : "Nuevo Producto"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* ── Galería de fotos (hasta 6, reordenable) ── */}
              <div>
                <label style={{ fontSize: 12, color: D.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Fotos del producto ({imagenes.length}/6) — la primera es la portada
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {imagenes.map((img, i) => (
                    <div key={img.id} style={{ position: "relative", width: 86, height: 86, borderRadius: 10, overflow: "hidden", border: i === 0 ? `2px solid ${D.primary}` : `1px solid ${D.border}` }}>
                      <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === 0 && (
                        <span style={{ position: "absolute", top: 2, left: 2, background: D.primary, color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 6 }}>PORTADA</span>
                      )}
                      <button onClick={() => quitarImagen(img.id)}
                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(239,68,68,.9)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={11} style={{ color: "#fff" }} />
                      </button>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", background: "rgba(0,0,0,.55)" }}>
                        <button onClick={() => moverImagen(img.id, -1)} disabled={i === 0}
                          style={{ flex: 1, background: "none", border: "none", color: i === 0 ? "#666" : "#fff", cursor: i === 0 ? "default" : "pointer", fontSize: 12, padding: "1px 0" }}>‹</button>
                        <button onClick={() => moverImagen(img.id, 1)} disabled={i === imagenes.length - 1}
                          style={{ flex: 1, background: "none", border: "none", color: i === imagenes.length - 1 ? "#666" : "#fff", cursor: i === imagenes.length - 1 ? "default" : "pointer", fontSize: 12, padding: "1px 0" }}>›</button>
                      </div>
                    </div>
                  ))}
                  {imagenes.length < 6 && (
                    <label style={{ width: 86, height: 86, borderRadius: 10, border: `1px dashed ${D.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", color: D.muted }}>
                      <ImagePlus size={20} />
                      <span style={{ fontSize: 9 }}>Agregar</span>
                      <input type="file" accept="image/*" multiple style={{ display: "none" }}
                        onChange={e => { addImagenes(e.target.files); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              </div>

              <input style={inp} placeholder="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              <div style={{ position: 'relative' }}>
                <textarea style={{ ...inp, height: 70, resize: "vertical", paddingRight: 110 }} placeholder="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                <button
                  type="button"
                  disabled={!form.nombre?.trim() || iaGenerando}
                  onClick={async () => {
                    if (!form.nombre?.trim()) { alert('Escribe primero el nombre del producto'); return; }
                    setIaGenerando(true);
                    try {
                      const catNombre = categorias.find(c => String(c.id) === String(form.categoria_id))?.nombre || '';
                      const res = await api.post(`${API}/productos/generar-descripcion`, { nombre: form.nombre, categoria: catNombre });
                      const desc = res.data?.data?.descripcion || res.data?.descripcion;
                      if (desc) setForm(f => ({ ...f, descripcion: desc }));
                    } catch {
                      alert('No se pudo generar la descripción. Intenta de nuevo.');
                    } finally { setIaGenerando(false); }
                  }}
                  title="Generar descripción con IA"
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: iaGenerando ? D.surface : 'linear-gradient(135deg, #16a34a, #22c55e)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '5px 10px', fontSize: 11, fontWeight: 700,
                    cursor: form.nombre?.trim() ? 'pointer' : 'not-allowed',
                    opacity: form.nombre?.trim() ? 1 : 0.5,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {iaGenerando ? '⏳ Generando…' : '✨ Generar IA'}
                </button>
              </div>

              {/* Selector de categoría real */}
              <div>
                <label style={{ fontSize: 12, color: D.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Categoría *</label>
                <select style={inp} value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
                  <option value="">Selecciona una categoría…</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: D.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Precio (Bs)</label>
                  <input style={inp} type="number" placeholder="0.00" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: D.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Stock</label>
                  <input style={inp} type="number" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>
              <ModalBtns onCancel={() => setModal(false)} onSave={handleSubmit} saving={saving} D={D} labelSave={isEditing ? "Actualizar" : "Crear"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function Inventario() {
  const { user }      = useAuth();
  const { D, isDark } = useTheme();
  const [tab, setTab] = useState("lagunas");

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: D.text }}>Inventario</h1>
          <p style={{ margin: "4px 0 0", color: D.muted, fontSize: 14 }}>Gestión de lagunas y productos</p>
        </div>
      </div>

      {/* Tabs principales */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: D.card,
        border: `1px solid ${D.border}`, borderRadius: 12, padding: 4, width: "fit-content" }}>
        {[
          { key: "lagunas",     label: "Lagunas",     icon: Fish    },
          { key: "productos",   label: "Productos",   icon: Package },
          { key: "movimientos", label: "Movimientos", icon: History },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all .15s",
              background: tab === t.key ? D.background : "transparent",
              color: tab === t.key ? D.primary : D.muted,
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,.1)" : "none" }}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "lagunas"     && <LagunaTab     user={user} D={D} isDark={isDark} />}
      {tab === "productos"   && <ProductosTab   user={user} D={D} isDark={isDark} />}
      {tab === "movimientos" && <MovimientosTab user={user} D={D} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  MODAL: Actualizar precio rápido
// ════════════════════════════════════════════════════════════════
function PrecioModal({ producto, D, inp, onClose, onSaved }) {
  const [precio, setPrecio] = useState(String(producto.precio || ""));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const guardar = async () => {
    const v = parseFloat(precio);
    if (!Number.isFinite(v) || v <= 0) { setError("Precio inválido"); return; }
    setSaving(true); setError(null);
    try {
      await api.patch(`${API}/productos/${producto.id}/precio`, { precio: v });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo actualizar");
    } finally { setSaving(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: D.background, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360 }}>
        <h3 style={{ margin: "0 0 14px", color: D.text, display: "flex", alignItems: "center", gap: 8 }}>
          <DollarSign size={18} style={{ color: "#22c55e" }} /> Actualizar precio
        </h3>
        <p style={{ margin: "0 0 14px", color: D.muted, fontSize: 13 }}>{producto.nombre}</p>
        <label style={{ fontSize: 12, color: D.muted, display: "block", marginBottom: 6 }}>Precio por kg (Bs)</label>
        <input style={inp} type="number" min="0" step="0.5" autoFocus
          value={precio} onChange={e => setPrecio(e.target.value)}
          onKeyDown={e => e.key === "Enter" && guardar()} />
        {error && <p style={{ color: "#ef4444", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
        <ModalBtns onCancel={onClose} onSave={guardar} saving={saving} D={D} labelSave="Guardar precio" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  MODAL: Registrar venta presencial
// ════════════════════════════════════════════════════════════════
function VentaPresencialModal({ producto, D, inp, onClose, onSaved }) {
  const [cantidad,    setCantidad]    = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  const guardar = async () => {
    const c = parseFloat(cantidad);
    if (!Number.isFinite(c) || c <= 0) { setError("Cantidad inválida"); return; }
    if (c > (producto.stock || 0)) { setError(`Stock insuficiente (disponible ${producto.stock || 0})`); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`${API}/inventario/movimientos`, {
        producto_id: producto.id,
        tipo:        "venta_offline",
        cantidad:    c,
        descripcion: descripcion || undefined,
      });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo registrar la venta");
    } finally { setSaving(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: D.background, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}>
        <h3 style={{ margin: "0 0 6px", color: D.text, display: "flex", alignItems: "center", gap: 8 }}>
          <Home size={18} style={{ color: "#8b5cf6" }} /> Venta presencial
        </h3>
        <p style={{ margin: "0 0 16px", color: D.muted, fontSize: 13 }}>
          {producto.nombre} · stock actual: <b style={{ color: D.text }}>{producto.stock || 0} {producto.unidad || "unidades"}</b>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: D.muted, display: "block", marginBottom: 6 }}>Cantidad vendida</label>
            <input style={inp} type="number" min="0" step="0.1" autoFocus
              value={cantidad} onChange={e => setCantidad(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: D.muted, display: "block", marginBottom: 6 }}>Notas (opcional)</label>
            <input style={inp} placeholder="Ej. cliente Pedro, pago efectivo"
              value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{error}</p>}
        </div>
        <ModalBtns onCancel={onClose} onSave={guardar} saving={saving} D={D} labelSave="Registrar venta" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TAB: MOVIMIENTOS DE INVENTARIO
// ════════════════════════════════════════════════════════════════
function MovimientosTab({ user, D }) {
  const [filtroTipo, setFiltroTipo] = useState("");
  const { data: movs = [], isLoading } = useQuery({
    queryKey: ["inv-movs", user?.id, filtroTipo],
    queryFn: () => api.get(`${API}/inventario/historial`, {
      params: filtroTipo ? { tipo: filtroTipo } : {},
    }).then(r => r.data?.data ?? []),
    enabled: !!user?.id,
  });

  const tipoMeta = {
    alta:           { label: "Entrada",           color: "#22c55e", icon: TrendingUp },
    venta_online:   { label: "Venta online",      color: "#3b82f6", icon: ShoppingBag },
    venta_offline:  { label: "Venta presencial",  color: "#8b5cf6", icon: Home },
    ajuste:         { label: "Ajuste",            color: "#f59e0b", icon: Wrench },
    merma:          { label: "Merma",             color: "#ef4444", icon: Skull },
    devolucion:     { label: "Devolución",        color: "#22c55e", icon: TrendingUp },
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          style={{ background: D.card, border: `1px solid ${D.border}`, color: D.text,
                   borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}>
          <option value="">Todos los tipos</option>
          {Object.entries(tipoMeta).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: D.muted }}>Cargando movimientos…</div>
      ) : movs.length === 0 ? (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 40, textAlign: "center", color: D.muted }}>
          No hay movimientos registrados.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {movs.map(m => {
            const meta = tipoMeta[m.tipo] || { label: m.tipo, color: D.muted, icon: Package };
            const Icon = meta.icon;
            const cantidad = parseFloat(m.cantidad);
            const fecha = new Date(m.fecha).toLocaleString("es-BO", {
              dateStyle: "short", timeStyle: "short",
            });
            return (
              <div key={m.id} style={{
                background: D.card, border: `1px solid ${D.border}`, borderRadius: 10,
                padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${meta.color}20`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} style={{ color: meta.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: D.text, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.producto_nombre || `Producto #${m.producto_id}`}
                    </span>
                    <span style={{ fontWeight: 700, color: cantidad >= 0 ? "#22c55e" : "#ef4444", fontSize: 14, flexShrink: 0 }}>
                      {cantidad >= 0 ? "+" : ""}{cantidad} {m.unidad}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ fontSize: 11, color: D.muted }}>{fecha}</span>
                  </div>
                  {m.descripcion && (
                    <div style={{ fontSize: 12, color: D.muted, marginTop: 4, fontStyle: "italic" }}>
                      {m.descripcion}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
