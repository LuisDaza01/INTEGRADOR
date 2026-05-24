// src/components/common/FloatingAssistant.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/config/axios';

const SUGERENCIAS = {
  productor: [
    '¿Cuántos pedidos tengo pendientes?',
    '¿Cómo registro el peso de un pedido?',
    '¿Qué hago si se acaba el stock?',
    '¿Cómo interpreto las alertas del sensor?',
  ],
  consumidor: [
    '¿Cómo hago una reserva?',
    '¿En qué estado está mi pedido?',
    '¿Cómo confirmo el precio pesado?',
    '¿Cómo contacto al productor?',
  ],
  repartidor: [
    '¿Cómo ingreso el código de retiro?',
    '¿Cómo marco un pedido como entregado?',
  ],
};

export default function FloatingAssistant() {
  const { D, isDark } = useTheme();
  const { user } = useAuth();

  const [abierto,  setAbierto]  = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input,    setInput]    = useState('');
  const [cargando, setCargando] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const rol = user?.rol === 'productor' ? 'productor'
            : user?.rol === 'repartidor' ? 'repartidor'
            : 'consumidor';

  const sugerencias = SUGERENCIAS[rol] || SUGERENCIAS.consumidor;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 200);
  }, [abierto]);

  const enviar = useCallback(async (texto) => {
    const msg = (texto ?? input).trim();
    if (!msg || cargando) return;
    setInput('');

    const previos = mensajes;
    setMensajes(prev => [...prev, { role: 'user', content: msg }]);
    setCargando(true);

    try {
      const res = await api.post(
        '/asistente',
        { mensaje: msg, historial: previos.slice(-8) },
        { timeout: 20000 },
      );
      setMensajes(prev => [...prev, { role: 'assistant', content: res.data?.respuesta || 'Sin respuesta.' }]);
    } catch (err) {
      const aviso = err?.code === 'ECONNABORTED'
        ? 'El asistente está tardando más de lo normal. Vuelve a intentarlo.'
        : err?.response?.status === 429
          ? 'Has hecho muchas consultas. Espera un momento e intenta de nuevo.'
          : 'No pude conectar con el asistente. Intenta de nuevo.';
      setMensajes(prev => [...prev, { role: 'assistant', content: aviso }]);
    } finally {
      setCargando(false);
    }
  }, [input, mensajes, cargando]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  const panel = {
    position: 'fixed', bottom: 88, right: 24, width: 340,
    background: isDark ? '#0D1525' : '#fff',
    border: `1px solid ${D.border}`,
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(14,165,233,0.22)',
    display: 'flex', flexDirection: 'column',
    height: 480, zIndex: 9999,
    animation: 'fadeUp 0.2s ease',
  };

  const fab = {
    position: 'fixed', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: '50%',
    background: 'linear-gradient(135deg,#16a34a,#22C55E)',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(34,197,94,0.45)',
    zIndex: 9999, transition: 'transform 0.15s',
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        .np-bubble-user { background:linear-gradient(135deg,#16a34a,#22C55E);color:#fff;border-radius:14px 14px 4px 14px; }
        .np-bubble-bot  { background:${isDark?'rgba(34,197,94,0.1)':'#F0FDF4'};color:${D.text};border-radius:14px 14px 14px 4px; }
        .np-chip:hover  { opacity:0.8; }
        .np-fab:hover   { transform:scale(1.08)!important; }
      `}</style>

      {abierto && (
        <div style={panel}>
          {/* Header */}
          <div style={{background:'linear-gradient(135deg,#16a34a,#22C55E)',borderRadius:'20px 20px 0 0',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🐟</div>
              <div>
                <div style={{color:'#fff',fontWeight:700,fontSize:14}}>Asistente NaturaPiscis</div>
              </div>
            </div>
            <button onClick={() => setAbierto(false)} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:20,lineHeight:1,padding:4}}>×</button>
          </div>

          {/* Mensajes */}
          <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
            {mensajes.length === 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div className="np-bubble-bot" style={{padding:'10px 14px',fontSize:13,lineHeight:1.5,alignSelf:'flex-start'}}>
                  ¡Hola{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}! ¿En qué te puedo ayudar?
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                  {sugerencias.map((s, i) => (
                    <button key={i} className="np-chip" onClick={() => enviar(s)}
                      style={{background:isDark?'rgba(34,197,94,0.1)':'#F0FDF4',border:'1px solid #22C55E',borderRadius:20,padding:'5px 12px',fontSize:11,color:'#22C55E',cursor:'pointer',fontWeight:500}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',alignItems:'flex-start',gap:6}}>
                {m.role === 'assistant' && (
                  <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(34,197,94,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0,marginTop:2}}>🐟</div>
                )}
                <div className={m.role==='user'?'np-bubble-user':'np-bubble-bot'}
                  style={{padding:'8px 12px',fontSize:13,lineHeight:1.55,maxWidth:'80%',whiteSpace:'pre-wrap'}}>
                  {m.content}
                </div>
              </div>
            ))}

            {cargando && (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(34,197,94,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>🐟</div>
                <div className="np-bubble-bot" style={{padding:'10px 16px'}}>
                  <span style={{display:'inline-flex',gap:4}}>
                    {[0,1,2].map(n=><span key={n} style={{width:6,height:6,borderRadius:'50%',background:'#22C55E',animation:`bounce 1s ${n*0.2}s infinite`,display:'inline-block'}}/>)}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{padding:'10px 12px',borderTop:`1px solid ${D.border}`,display:'flex',gap:8,alignItems:'flex-end',background:isDark?'#0D1525':'#fff',borderRadius:'0 0 20px 20px'}}>
            <textarea ref={inputRef} rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKeyDown}
              placeholder="Escribe tu pregunta..."
              style={{flex:1,resize:'none',border:`1px solid ${D.border}`,borderRadius:12,padding:'8px 12px',fontSize:13,background:isDark?'#1E293B':'#F3F4F6',color:D.text,outline:'none',maxHeight:80,lineHeight:1.5}}
            />
            <button onClick={() => enviar()} disabled={!input.trim()||cargando}
              style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#16a34a,#22C55E)',border:'none',cursor:input.trim()&&!cargando?'pointer':'not-allowed',opacity:input.trim()&&!cargando?1:0.4,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="np-fab" style={fab} onClick={() => setAbierto(o=>!o)} title="Asistente IA">
        {abierto
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        }
      </button>
    </>
  );
}
