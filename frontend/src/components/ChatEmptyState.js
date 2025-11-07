import React from 'react';

function ChatEmptyState({ onSuggestionClick }) {
  const suggestions = [
    'Como abrir um chamado?',
    'Verificar o status de um ticket',
    'Falar com um atendente humano'
  ];

  return (
    <div className="chat-empty-state">
      <div className="empty-state-logo">
        Smart<span className="logo-accent">Call</span>
      </div>
      <h2 className="empty-state-title">Como posso te ajudar hoje?</h2>
      <div className="suggestion-chips">
        {suggestions.map((suggestion, index) => (
          <button 
            key={index}
            className="suggestion-chip"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChatEmptyState;
