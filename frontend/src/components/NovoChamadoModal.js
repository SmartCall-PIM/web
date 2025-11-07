import React, { useState } from 'react';
import '../styles/NovoChamadoModal.css';

function NovoChamadoModal({ onClose, onCriar }) {
  const [mensagemInicial, setMensagemInicial] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (mensagemInicial.length < 10) {
      setErro('Mensagem deve ter no mínimo 10 caracteres');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      await onCriar(mensagemInicial);
      onClose();
    } catch (error) {
      setErro('Erro ao criar chamado. Tente novamente.');
      console.error('Erro ao criar chamado:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Chamado</h2>
          <button className="modal-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {erro && <div className="form-error">{erro}</div>}

          <div className="form-group">
            <label htmlFor="mensagemInicial">Descreva seu problema *</label>
            <textarea
              id="mensagemInicial"
              name="mensagemInicial"
              value={mensagemInicial}
              onChange={(e) => {
                setMensagemInicial(e.target.value);
                setErro('');
              }}
              placeholder="Descreva detalhadamente o problema que você está enfrentando..."
              required
              minLength={10}
              maxLength={1000}
              rows={6}
              disabled={loading}
              autoFocus
            />
            <span className="form-hint">
              {mensagemInicial.length}/1000 caracteres (mínimo 10)
            </span>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || mensagemInicial.length < 10}
            >
              {loading ? 'Criando...' : 'Criar Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NovoChamadoModal;
