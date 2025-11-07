import React from 'react';
import '../styles/LogoutModal.css';

function ConfirmarResolucaoModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="confirm-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h2>Confirmar Resolução</h2>
        </div>

        <div className="modal-body">
          <p>Deseja concluir o chamado?</p>
          <p className="modal-hint">O chamado será marcado como resolvido e não será possível enviar novas mensagens.</p>
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-success" 
            onClick={onConfirm}
          >
            Sim, Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarResolucaoModal;
