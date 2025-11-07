import React, { useState, useEffect } from 'react';
import chamadoService from '../services/chamadoService';

function Relatorios({ onVoltar }) {
  const [stats, setStats] = useState({
    total: 0,
    emAndamento: 0,
    resolvidos: 0,
    escalados: 0,
    hoje: 0,
    semana: 0,
    mes: 0
  });

  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTempo, setFiltroTempo] = useState('mes'); // hoje, semana, mes, todos

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      // Busca TODOS os chamados do sistema (não apenas do usuário logado)
      const data = await chamadoService.listarTodosChamados();
      setChamados(data);
      calcularEstatisticas(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (chamadosList) => {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const semanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const mesAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const estatisticas = {
      total: chamadosList.length,
      emAndamento: chamadosList.filter(c => c.Status === 'Em Andamento').length,
      resolvidos: chamadosList.filter(c => c.Status === 'Resolvido').length,
      escalados: chamadosList.filter(c => c.TecnicoId !== null).length,
      hoje: chamadosList.filter(c => new Date(c.CriadoEm) >= hoje).length,
      semana: chamadosList.filter(c => new Date(c.CriadoEm) >= semanaAtras).length,
      mes: chamadosList.filter(c => new Date(c.CriadoEm) >= mesAtras).length
    };

    setStats(estatisticas);
  };

  const getChamadosFiltrados = () => {
    const agora = new Date();
    
    switch (filtroTempo) {
      case 'hoje':
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        return chamados.filter(c => new Date(c.CriadoEm) >= hoje);
      
      case 'semana':
        const semanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
        return chamados.filter(c => new Date(c.CriadoEm) >= semanaAtras);
      
      case 'mes':
        const mesAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        return chamados.filter(c => new Date(c.CriadoEm) >= mesAtras);
      
      default:
        return chamados;
    }
  };

  const getCategoriaStats = () => {
    const filtrados = getChamadosFiltrados();
    const categorias = {};
    
    filtrados.forEach(chamado => {
      const cat = chamado.Categoria || 'Sem categoria';
      categorias[cat] = (categorias[cat] || 0) + 1;
    });

    return Object.entries(categorias)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  };

  const getPrioridadeStats = () => {
    const filtrados = getChamadosFiltrados();
    const prioridades = {
      'Alta': 0,
      'Média': 0,
      'Baixa': 0
    };

    filtrados.forEach(chamado => {
      const prio = chamado.Prioridade || 'Média';
      prioridades[prio] = (prioridades[prio] || 0) + 1;
    });

    return prioridades;
  };

  const getTempoMedioResolucao = () => {
    const resolvidos = getChamadosFiltrados().filter(c => c.Status === 'Resolvido');
    
    if (resolvidos.length === 0) return 'N/A';

    const tempos = resolvidos.map(c => {
      const criado = new Date(c.CriadoEm);
      const atualizado = new Date(c.AtualizadoEm);
      return (atualizado - criado) / (1000 * 60 * 60); // horas
    });

    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    
    if (media < 1) {
      return `${Math.round(media * 60)} min`;
    } else if (media < 24) {
      return `${media.toFixed(1)} h`;
    } else {
      return `${(media / 24).toFixed(1)} dias`;
    }
  };

  const getTaxaResolucao = () => {
    const filtrados = getChamadosFiltrados();
    if (filtrados.length === 0) return 0;
    
    const resolvidos = filtrados.filter(c => c.Status === 'Resolvido').length;
    return Math.round((resolvidos / filtrados.length) * 100);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const prioridadeStats = getPrioridadeStats();
  const categoriaStats = getCategoriaStats();
  const maxCategoria = Math.max(...categoriaStats.map(c => c.quantidade), 1);

  if (loading) {
    return (
      <div className="relatorios-container">
        <div className="loading">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="relatorios-container">
      <div className="relatorios-header">
        <button className="btn-voltar" onClick={onVoltar}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>
        <h1>Relatórios e Estatísticas</h1>
      </div>

      {/* Filtro de Tempo */}
      <div className="filtro-tempo">
        <button 
          className={filtroTempo === 'hoje' ? 'active' : ''} 
          onClick={() => setFiltroTempo('hoje')}
        >
          Hoje
        </button>
        <button 
          className={filtroTempo === 'semana' ? 'active' : ''} 
          onClick={() => setFiltroTempo('semana')}
        >
          Última Semana
        </button>
        <button 
          className={filtroTempo === 'mes' ? 'active' : ''} 
          onClick={() => setFiltroTempo('mes')}
        >
          Último Mês
        </button>
        <button 
          className={filtroTempo === 'todos' ? 'active' : ''} 
          onClick={() => setFiltroTempo('todos')}
        >
          Todos
        </button>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>Total de Chamados</h3>
            <p className="stat-number">{getChamadosFiltrados().length}</p>
          </div>
        </div>

        <div className="stat-card andamento">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>Em Andamento</h3>
            <p className="stat-number">{getChamadosFiltrados().filter(c => c.Status === 'Em Andamento').length}</p>
          </div>
        </div>

        <div className="stat-card resolvidos">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>Resolvidos</h3>
            <p className="stat-number">{getChamadosFiltrados().filter(c => c.Status === 'Resolvido').length}</p>
          </div>
        </div>

        <div className="stat-card taxa">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>Taxa de Resolução</h3>
            <p className="stat-number">{getTaxaResolucao()}%</p>
          </div>
        </div>
      </div>

      {/* Métricas Avançadas */}
      <div className="metricas-grid">
        <div className="metrica-card">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Tempo Médio de Resolução
          </h3>
          <p className="metrica-valor">{getTempoMedioResolucao()}</p>
        </div>
      </div>
    </div>
  );
}

export default Relatorios;
