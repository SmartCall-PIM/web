import React, { useState, useEffect } from 'react';
import ChatChamado from './ChatChamado';
import chamadoService from '../services/chamadoService';

function ChamadosSolicitados({ onVoltar }) {
  const [chamados, setChamados] = useState([]);
  const [chamadoAtivo, setChamadoAtivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarChamados();
  }, []);

  const carregarChamados = async () => {
    try {
      setLoading(true);
      const data = await chamadoService.listarChamadosTecnico();
      setChamados(data);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarChamado = async (chamado) => {
    try {
      const chamadoDetalhado = await chamadoService.buscarChamado(chamado.Id);
      setChamadoAtivo(chamadoDetalhado);
    } catch (error) {
      console.error('Erro ao buscar chamado:', error);
    }
  };

  const handleAtualizarChamado = async () => {
    await carregarChamados();
    if (chamadoAtivo) {
      const chamadoAtualizado = await chamadoService.buscarChamado(chamadoAtivo.Id);
      setChamadoAtivo(chamadoAtualizado);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (data.toDateString() === ontem.toDateString()) {
      return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  return (
    <div className="dashboard-body">
      <div className="chamados-sidebar chamados-solicitados-sidebar">
        <div className="chamados-header">
          <button className="btn-voltar" onClick={onVoltar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar
          </button>
          <h2>Chamados Solicitados</h2>
          <p className="chamados-count">{chamados.length} chamado(s)</p>
        </div>

        <div className="chamados-list">
          {loading ? (
            <div className="loading-state">
              <p>Carregando chamados...</p>
            </div>
          ) : chamados.length === 0 ? (
            <div className="empty-state-small">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>Nenhum chamado atribuído</p>
            </div>
          ) : (
            chamados.map(chamado => (
              <div
                key={chamado.Id}
                className={`chamado-item ${chamadoAtivo?.Id === chamado.Id ? 'active' : ''}`}
                onClick={() => handleSelecionarChamado(chamado)}
              >
                <div className="chamado-info">
                  <h3 className="chamado-titulo">{chamado.Titulo}</h3>
                  <p className="chamado-usuario">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 20a6 6 0 0 0-12 0"/>
                      <circle cx="12" cy="10" r="4"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    {chamado.NomeUsuario || chamado.Email}
                  </p>
                  {chamado.UltimaMensagem && (
                    <p className="chamado-preview">{chamado.UltimaMensagem}</p>
                  )}
                </div>
                <div className="chamado-meta">
                  <span className={`chamado-status ${chamado.Status === 'Resolvido' ? 'resolvido' : 'andamento'}`}>
                    {chamado.Status}
                  </span>
                  <span className="chamado-data">{formatarData(chamado.AtualizadoEm || chamado.CriadoEm)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ChatChamado 
        chamado={chamadoAtivo}
        onAtualizarChamado={handleAtualizarChamado}
        isTecnico={true}
      />
    </div>
  );
}

export default ChamadosSolicitados;
