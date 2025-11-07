import React, { useState } from 'react';
import ChamadosSolicitados from './ChamadosSolicitados';
import Relatorios from './Relatorios';

function Tecnico() {
  const [paginaAtiva, setPaginaAtiva] = useState('dashboard');

  if (paginaAtiva === 'chamados-solicitados') {
    return <ChamadosSolicitados onVoltar={() => setPaginaAtiva('dashboard')} />;
  }

  if (paginaAtiva === 'relatorios') {
    return <Relatorios onVoltar={() => setPaginaAtiva('dashboard')} />;
  }

  return (
    <div className="tecnico-container">
      <div className="tecnico-content">
        <h1 className="page-title">Painel Técnico</h1>
        
        <div className="tecnico-welcome">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <h2>Bem-vindo ao Painel Técnico</h2>
          <p>Esta área é exclusiva para técnicos e administradores do sistema.</p>
        </div>

        <div className="tecnico-grid">
          <div className="tecnico-card" onClick={() => setPaginaAtiva('chamados-solicitados')}>
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            <h3>Chamados Solicitados</h3>
            <p>Visualize e atenda chamados que foram escalados para você.</p>
          </div>

          <div className="tecnico-card" onClick={() => setPaginaAtiva('relatorios')}>
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Relatórios</h3>
            <p>Visualize relatórios técnicos e estatísticas do sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tecnico;
