import React from 'react';
import type { LocalRoutine } from '@/hooks/useLocalRoutines';

interface RoutinePrintViewProps {
  client: {
    nombre: string;
    documento: string;
    numero_cliente?: string | number;
    comentarios?: string;
  };
  routine: LocalRoutine;
}

const DIAS = ['dia1', 'dia2', 'dia3', 'dia4', 'dia5'] as const;
const DIAS_LABEL: Record<string, string> = {
  dia1: 'Día 1', dia2: 'Día 2', dia3: 'Día 3', dia4: 'Día 4', dia5: 'Día 5'
};

const RoutinePrintView: React.FC<RoutinePrintViewProps> = ({ client, routine }) => {
  // Solo mostrar días que tienen ejercicios
  const diasConEjercicios = DIAS.filter(dia => {
    const d = routine.dias[dia];
    return d.entradaCalor.length > 0 || d.entrenamiento.length > 0;
  });

  return (
    <div id="routine-print-area">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #routine-print-area,
          #routine-print-area * { visibility: visible !important; }
          #routine-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }
        }

        #routine-print-area {
          display: none;
          font-family: 'Arial', sans-serif;
          font-size: 10pt;
          color: #1a1a1a;
          background: white;
        }

        /* Solo visible al imprimir */
        @media print {
          #routine-print-area { display: block !important; }
        }

        /* ── Header ── */
        .rp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #f97316;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .rp-gym-name {
          font-size: 16pt;
          font-weight: 800;
          color: #f97316;
          letter-spacing: 1px;
        }
        .rp-gym-sub {
          font-size: 8pt;
          color: #888;
          margin-top: 1px;
        }
        .rp-date {
          font-size: 8pt;
          color: #666;
          text-align: right;
        }

        /* ── Ficha cliente ── */
        .rp-client-card {
          display: flex;
          align-items: stretch;
          gap: 12px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }
        .rp-client-photo {
          width: 72px;
          height: 54px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #fdba74;
          flex-shrink: 0;
        }
        .rp-client-photo-placeholder {
          width: 72px;
          height: 54px;
          background: #fed7aa;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #f97316;
          font-size: 20pt;
        }
        .rp-client-info { flex: 1; }
        .rp-client-name {
          font-size: 13pt;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.2;
        }
        .rp-client-meta {
          font-size: 8pt;
          color: #666;
          margin-top: 2px;
        }
        .rp-client-meta span { margin-right: 14px; }
        .rp-client-prof {
          font-size: 8pt;
          color: #f97316;
          font-weight: 600;
          margin-top: 3px;
        }
        .rp-comments {
          font-size: 8pt;
          color: #7c3c00;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 4px;
          padding: 4px 8px;
          margin-top: 4px;
        }
        .rp-comments-label {
          font-weight: 700;
          margin-right: 4px;
        }

        /* ── Día ── */
        .rp-day {
          margin-bottom: 10px;
          break-inside: avoid;
        }
        .rp-day-header {
          background: #f97316;
          color: white;
          font-size: 10pt;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 4px 4px 0 0;
          letter-spacing: 0.5px;
        }
        .rp-section {
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .rp-section-label {
          background: #f9fafb;
          font-size: 8pt;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .rp-section:last-child { border-radius: 0 0 4px 4px; }

        /* ── Tabla ejercicios ── */
        .rp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
        }
        .rp-table th {
          background: #f3f4f6;
          color: #374151;
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 3px 8px;
          border-bottom: 1px solid #d1d5db;
          text-align: left;
        }
        .rp-table th:nth-child(1) { width: 42%; }
        .rp-table th:nth-child(2) { width: 12%; text-align: center; }
        .rp-table th:nth-child(3) { width: 18%; text-align: center; }
        .rp-table th:nth-child(4) { width: 28%; }
        .rp-table td {
          padding: 4px 8px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
          line-height: 1.3;
        }
        .rp-table tr:last-child td { border-bottom: none; }
        .rp-table td:nth-child(2),
        .rp-table td:nth-child(3) { text-align: center; }
        .rp-table tr:nth-child(even) td { background: #fafafa; }
        .rp-obs { font-size: 8pt; color: #6b7280; font-style: italic; }

        /* ── Footer ── */
        .rp-footer {
          margin-top: 14px;
          border-top: 1px solid #e5e7eb;
          padding-top: 6px;
          display: flex;
          justify-content: space-between;
          font-size: 7.5pt;
          color: #9ca3af;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="rp-header">
        <div>
          <div className="rp-gym-name">URBAN GYM</div>
          <div className="rp-gym-sub">Sistema de Rutinas de Entrenamiento</div>
        </div>
        <div className="rp-date">
          Fecha: {new Date(routine.fecha_asignacion).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric'
          })}
          {routine.fecha_vencimiento && (
            <><br />Vence: {new Date(routine.fecha_vencimiento).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}</>
          )}
        </div>
      </div>

      {/* ── FICHA CLIENTE ── */}
      <div className="rp-client-card">
        {/* Foto */}
        {client.numero_cliente ? (
          <img
            className="rp-client-photo"
            src={`/bmp/${client.numero_cliente}.jpg`}
            alt={client.nombre}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
            }}
          />
        ) : null}
        <div className="rp-client-photo-placeholder" style={client.numero_cliente ? {display:'none'} : {}}>
          👤
        </div>

        {/* Datos */}
        <div className="rp-client-info">
          <div className="rp-client-name">{client.nombre}</div>
          <div className="rp-client-meta">
            <span>DNI: {client.documento}</span>
            {client.numero_cliente && <span>Socio Nº {client.numero_cliente}</span>}
          </div>
          {routine.profesor_nombre && (
            <div className="rp-client-prof">Profesor: {routine.profesor_nombre}</div>
          )}
          {client.comentarios && (
            <div className="rp-comments">
              <span className="rp-comments-label">⚠ Lesiones / Comentarios:</span>
              {client.comentarios}
            </div>
          )}
        </div>
      </div>

      {/* ── DÍAS ── */}
      {diasConEjercicios.length === 0 ? (
        <p style={{color:'#9ca3af', fontStyle:'italic', textAlign:'center', padding:'20px'}}>
          La rutina no tiene ejercicios cargados.
        </p>
      ) : (
        diasConEjercicios.map(dia => {
          const d = routine.dias[dia];
          return (
            <div key={dia} className="rp-day">
              <div className="rp-day-header">{DIAS_LABEL[dia]}</div>

              {/* Entrada en calor */}
              {d.entradaCalor.length > 0 && (
                <div className="rp-section">
                  <div className="rp-section-label">Entrada en Calor</div>
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Ejercicio</th>
                        <th>Series</th>
                        <th>Repeticiones</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.entradaCalor.map((ex, i) => (
                        <tr key={i}>
                          <td>{ex.ejercicio}</td>
                          <td>{ex.series || '—'}</td>
                          <td>{ex.repeticiones || '—'}</td>
                          <td className="rp-obs">{ex.observaciones || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Entrenamiento */}
              {d.entrenamiento.length > 0 && (
                <div className="rp-section">
                  <div className="rp-section-label">Entrenamiento</div>
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Ejercicio</th>
                        <th>Series</th>
                        <th>Repeticiones</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.entrenamiento.map((ex, i) => (
                        <tr key={i}>
                          <td>{ex.ejercicio}</td>
                          <td>{ex.series || '—'}</td>
                          <td>{ex.repeticiones || '—'}</td>
                          <td className="rp-obs">{ex.observaciones || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ── FOOTER ── */}
      <div className="rp-footer">
        <span>Urban Gym — Rutina generada el {new Date().toLocaleDateString('es-AR')}</span>
        <span>Socio Nº {client.numero_cliente} · {client.nombre}</span>
      </div>
    </div>
  );
};

export default RoutinePrintView;
