import React from 'react';
import '../styles/ChamadosList.css';

function ChamadosList({ chamados, chamadoAtivo, onSelecionarChamado, onNovoChamado }) {
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    const agora = new Date();
    const diff = agora - data;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade?.toLowerCase()) {
      case 'alta': return '#ef4444';
      case 'média': return '#f59e0b';
      case 'baixa': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'aberto': return '#3b82f6';
      case 'em andamento': return '#f59e0b';
      case 'resolvido': return '#10b981';
      case 'fechado': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className="chamados-sidebar">
      <div className="chamados-header">
        <h2>Chamados</h2>
        <button className="btn-novo-chamado" onClick={onNovoChamado}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo
        </button>
      </div>

      <div className="chamados-lista">
        {chamados.length === 0 ? (
          <div className="chamados-empty">
            <p>Nenhum chamado aberto</p>
            <button onClick={onNovoChamado}>Criar primeiro chamado</button>
          </div>
        ) : (
          chamados.map((chamado) => (
            <div
              key={chamado.Id}
              className={`chamado-item ${chamadoAtivo?.Id === chamado.Id ? 'ativo' : ''}`}
              onClick={() => onSelecionarChamado(chamado)}
            >
              <div className="chamado-item-header">
                <div className="chamado-info">
                  <h3 className="chamado-titulo">{chamado.Titulo}</h3>
                  <span className="chamado-usuario">{chamado.NomeUsuario}</span>
                </div>
                <span className="chamado-tempo">{formatarData(chamado.AtualizadoEm || chamado.CriadoEm)}</span>
              </div>

              <p className="chamado-preview">
                {chamado.UltimaMensagem?.substring(0, 60)}
                {chamado.UltimaMensagem?.length > 60 ? '...' : ''}
              </p>

              <div className="chamado-item-footer">
                <div className="chamado-badges">
                  {chamado.Prioridade && (
                    <span 
                      className="badge badge-prioridade"
                      style={{ backgroundColor: getPrioridadeColor(chamado.Prioridade) }}
                    >
                      {chamado.Prioridade}
                    </span>
                  )}
                  <span 
                    className="badge badge-status"
                    style={{ backgroundColor: getStatusColor(chamado.Status) }}
                  >
                    {chamado.Status}
                  </span>
                </div>
                <span className="chamado-mensagens-count">
                  {chamado.TotalMensagens} mensagens
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChamadosList;
