import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChamadosList from './components/ChamadosList';
import ChatChamado from './components/ChatChamado';
import NovoChamadoModal from './components/NovoChamadoModal';
import Configuracoes from './components/Configuracoes';
import Gerenciamento from './components/Gerenciamento';
import Tecnico from './components/Tecnico';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import chamadoService from './services/chamadoService';
import authService from './services/authService';
import heartbeatService from './services/heartbeatService';
import './styles.css';

function ChatApp() {
  const [user, setUser] = useState(null);
  const [chamados, setChamados] = useState([]);
  const [chamadoAtivo, setChamadoAtivo] = useState(null);
  const [activePage, setActivePage] = useState('chamados');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar dados do usuário
  useEffect(() => {
    const carregarUsuario = async () => {
      const token = authService.getToken();
      if (token) {
        // Busca os dados atualizados do servidor
        const userData = await authService.fetchCurrentUser();
        if (userData) {
          setUser(userData);
        }
      } else {
        const userData = authService.getUser();
        if (userData) {
          setUser(userData);
        }
      }
    };

    carregarUsuario();

    // Listener para atualização de perfil
    const handleProfileUpdate = () => {
      const updatedUser = authService.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Heartbeat para manter usuário online
  useEffect(() => {
    const token = authService.getToken();
    
    if (token) {
      // Inicia o heartbeat quando o usuário está autenticado
      heartbeatService.startHeartbeat();
      
      return () => {
        // Para o heartbeat quando o componente desmontar ou o usuário fazer logout
        heartbeatService.stopHeartbeat();
      };
    }
  }, [user]); // Reage a mudanças no estado do usuário

  const handleLogout = async (e) => {
    if (e) {
      e.preventDefault();
    }
    // Para o heartbeat antes de fazer logout
    heartbeatService.stopHeartbeat();
    await authService.logout();
    window.location.href = '/login';
  };

  const carregarChamados = async () => {
    try {
      setLoading(true);
      const data = await chamadoService.listarChamados();
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

  const handleCriarChamado = async (mensagemInicial) => {
    try {
      const novoChamado = await chamadoService.criarChamado(mensagemInicial);
      await carregarChamados();
      setChamadoAtivo(novoChamado);
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      throw error;
    }
  };

  const handleAtualizarChamado = async () => {
    await carregarChamados();
    if (chamadoAtivo) {
      const atualizado = await chamadoService.buscarChamado(chamadoAtivo.Id);
      setChamadoAtivo(atualizado);
    }
  };

  useEffect(() => {
    carregarChamados();
  }, []);

  return (
    <div className="dashboard-body">
      <Sidebar 
        userName={user?.FullName || user?.Email || 'Usuário'}
        userRole={user?.Role || user?.role || 'Usuário'}
        onLogout={handleLogout}
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
      />
      
      {activePage === 'chamados' && (
        <>
          <ChamadosList 
            chamados={chamados}
            chamadoAtivo={chamadoAtivo}
            onSelecionarChamado={handleSelecionarChamado}
            onNovoChamado={() => setMostrarModal(true)}
          />
          <ChatChamado 
            chamado={chamadoAtivo}
            onAtualizarChamado={handleAtualizarChamado}
          />
        </>
      )}

      {activePage === 'gerenciamento' && (user?.Role === 'Administrador' || user?.role === 'Administrador') && (
        <Gerenciamento />
      )}

      {activePage === 'gerenciamento' && (user?.Role !== 'Administrador' && user?.role !== 'Administrador') && (
        <div className="acesso-negado">
          <div className="acesso-negado-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <h2>Acesso Negado</h2>
            <p>Você não tem permissão para acessar esta página.</p>
            <p>Apenas administradores podem gerenciar usuários.</p>
          </div>
        </div>
      )}

      {activePage === 'tecnico' && (user?.Role === 'Técnico' || user?.Role === 'Administrador' || user?.role === 'Técnico' || user?.role === 'Administrador') && (
        <Tecnico />
      )}

      {activePage === 'tecnico' && (user?.Role !== 'Técnico' && user?.Role !== 'Administrador' && user?.role !== 'Técnico' && user?.role !== 'Administrador') && (
        <div className="acesso-negado">
          <div className="acesso-negado-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <h2>Acesso Negado</h2>
            <p>Você não tem permissão para acessar esta página.</p>
            <p>Apenas técnicos e administradores podem acessar o painel técnico.</p>
          </div>
        </div>
      )}

      {activePage === 'configuracoes' && (
        <Configuracoes />
      )}

      {mostrarModal && (
        <NovoChamadoModal 
          onClose={() => setMostrarModal(false)}
          onCriar={handleCriarChamado}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/chamados" 
          element={
            <PrivateRoute>
              <ChatApp />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/chamados" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

