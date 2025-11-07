import React from 'react';
import '../styles/LogoutModal.css';

function LogoutModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logout-icon">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
          <h2>Confirmar Logout</h2>
        </div>

        <div className="modal-body">
          <p>Tem certeza que deseja sair da sua conta?</p>
          <p className="modal-hint">Você precisará fazer login novamente para acessar o sistema.</p>
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
            className="btn btn-danger" 
            onClick={onConfirm}
          >
            Sim, Sair
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;
