import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

function Gerenciamento() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmacaoDelete, setConfirmacaoDelete] = useState(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setErro('Erro ao carregar lista de usuários');
    } finally {
      setCarregando(false);
    }
  };

  const handleEditarUsuario = (usuario) => {
    console.log('Usuário selecionado:', usuario);
    setUsuarioEditando({
      id: usuario.id || usuario.Id,
      fullName: usuario.fullName || usuario.FullName,
      email: usuario.email || usuario.Email,
      role: usuario.role || usuario.Role || 'Usuário'
    });
    setModalAberto(true);
    setErro('');
    setMensagem('');
  };

  const handleSalvarUsuario = async (e) => {
    e.preventDefault();
    
    console.log('Salvando usuário:', usuarioEditando);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/users/${usuarioEditando.id}`,
        {
          email: usuarioEditando.email,
          role: usuarioEditando.role
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Resposta do servidor:', response.data);
      
      // Verifica se o usuário editado é o usuário logado
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isCurrentUser = currentUser.Id === usuarioEditando.id || currentUser.id === usuarioEditando.id;
      
      // Se o role foi alterado e é o usuário atual, renova o token
      if (response.data.requiresRelogin && isCurrentUser) {
        try {
          setMensagem('Suas permissões foram alteradas. Atualizando token...');
          
          // Renova o token JWT com as informações atualizadas
          await authService.refreshToken();
          
          // Dispara evento para atualizar sidebar
          window.dispatchEvent(new Event('profileUpdated'));
          
          setMensagem('Usuário atualizado com sucesso! Token renovado.');
          setModalAberto(false);
          setUsuarioEditando(null);
          carregarUsuarios();
          
          setTimeout(() => {
            setMensagem('');
            // Recarrega a página para aplicar todas as mudanças
            window.location.reload();
          }, 2000);
          return;
        } catch (error) {
          console.error('Erro ao renovar token:', error);
          setErro('Erro ao atualizar permissões. Faça login novamente.');
          setTimeout(() => {
            localStorage.clear();
            window.location.href = '/login';
          }, 2000);
          return;
        }
      }
      
      // Se foi outro usuário ou apenas email foi alterado
      if (isCurrentUser) {
        // Atualiza o localStorage com o novo role
        currentUser.Role = usuarioEditando.role;
        currentUser.role = usuarioEditando.role;
        if (usuarioEditando.email !== currentUser.Email && usuarioEditando.email !== currentUser.email) {
          currentUser.Email = usuarioEditando.email;
          currentUser.email = usuarioEditando.email;
        }
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Dispara evento para atualizar sidebar
        window.dispatchEvent(new Event('profileUpdated'));
      }
      
      setMensagem('Usuário atualizado com sucesso!');
      setModalAberto(false);
      setUsuarioEditando(null);
      carregarUsuarios();
      
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      console.error('Detalhes do erro:', error.response?.data);
      setErro(error.response?.data?.message || 'Erro ao atualizar usuário');
    }
  };

  const handleDeletarUsuario = async (usuarioId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/users/${usuarioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMensagem('Usuário deletado com sucesso!');
      setConfirmacaoDelete(null);
      carregarUsuarios();
      
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      setErro(error.response?.data?.message || 'Erro ao deletar usuário');
      setConfirmacaoDelete(null);
    }
  };

  const handleCancelar = () => {
    setModalAberto(false);
    setUsuarioEditando(null);
    setErro('');
  };

  const getBadgeClass = (role) => {
    const roleNormalized = (role || 'Usuário').toLowerCase();
    if (roleNormalized.includes('admin')) return 'badge badge-administrador';
    if (roleNormalized.includes('técnico') || roleNormalized.includes('tecnico')) return 'badge badge-tecnico';
    return 'badge badge-usuario';
  };

  if (carregando) {
    return (
      <div className="gerenciamento-container">
        <div className="loading">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="gerenciamento-container">
      <div className="gerenciamento-content">
        <h1 className="page-title">Gerenciamento de Usuários</h1>

        {mensagem && (
          <div className="alert alert-success">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="alert alert-error">
            {erro}
          </div>
        )}

        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Data de Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id || usuario.Id}>
                  <td>{usuario.fullName || usuario.FullName}</td>
                  <td>{usuario.email || usuario.Email}</td>
                  <td>
                    <span className={getBadgeClass(usuario.role || usuario.Role)}>
                      {usuario.role || usuario.Role || 'Usuário'}
                    </span>
                  </td>
                  <td>
                    {new Date(usuario.createdAt || usuario.CreatedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditarUsuario(usuario)}
                        title="Editar usuário"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => setConfirmacaoDelete(usuario)}
                        title="Deletar usuário"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuarios.length === 0 && (
            <div className="empty-state">
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      {modalAberto && usuarioEditando && (
        <div className="modal-overlay" onClick={handleCancelar}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Usuário</h2>
              <button className="modal-close" onClick={handleCancelar}>×</button>
            </div>
            <form onSubmit={handleSalvarUsuario}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    value={usuarioEditando.fullName}
                    disabled
                    className="input-disabled"
                  />
                  <small>O nome só pode ser alterado pelo próprio usuário</small>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={usuarioEditando.email}
                    onChange={(e) => setUsuarioEditando({
                      ...usuarioEditando,
                      email: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cargo</label>
                  <select
                    value={usuarioEditando.role}
                    onChange={(e) => setUsuarioEditando({
                      ...usuarioEditando,
                      role: e.target.value
                    })}
                  >
                    <option value="Usuário">Usuário</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCancelar}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Delete */}
      {confirmacaoDelete && (
        <div className="modal-overlay" onClick={() => setConfirmacaoDelete(null)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Exclusão</h2>
              <button className="modal-close" onClick={() => setConfirmacaoDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja deletar o usuário <strong>{confirmacaoDelete.fullName || confirmacaoDelete.FullName}</strong>?</p>
              <p className="warning-text">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmacaoDelete(null)}>
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDeletarUsuario(confirmacaoDelete.id || confirmacaoDelete.Id)}
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gerenciamento;
