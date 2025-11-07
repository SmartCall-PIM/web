import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import ConfirmarResolucaoModal from './ConfirmarResolucaoModal';

function ChatMessage({ message, isUser, senderType, onFeedback, chamadoBloqueado, atribuidoATecnico }) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFeedbackYes = () => {
    setShowModal(true);
  };

  const handleConfirmResolucao = () => {
    setShowModal(false);
    setFeedbackGiven(true);
    if (onFeedback) {
      onFeedback(true);
    }
  };

  const handleCancelResolucao = () => {
    setShowModal(false);
  };

  const handleFeedbackNo = async () => {
    setFeedbackGiven(true);
    if (onFeedback) {
      await onFeedback(false);
    }
  };
  
  // Determina a classe CSS baseada no tipo de remetente
  const messageClass = senderType === 'tecnico' ? 'tecnico-message' : isUser ? 'user-message' : 'bot-message';
  
  return (
    <div className={`chat-message ${messageClass}`}>
      <div className="message-avatar">
        {isUser ? (
          <>
            {senderType === 'tecnico' ? (
              <div className="tecnico-avatar">TÉC</div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20a6 6 0 0 0-12 0"/>
                <circle cx="12" cy="10" r="4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            )}
          </>
        ) : (
          <div className="bot-avatar">AI</div>
        )}
      </div>
      <div className="message-content">
        {isUser ? (
          <>
            {senderType === 'tecnico' && <span className="sender-label">Técnico</span>}
            <p>{message}</p>
          </>
        ) : (
          <>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                // Customiza a renderização de links para abrir em nova aba
                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}
            >
              {message}
            </ReactMarkdown>
            
            <div className="feedback-section">
              <p className="feedback-question">Seu problema foi resolvido?</p>
              {!feedbackGiven && !chamadoBloqueado ? (
                <div className="feedback-buttons">
                  <button 
                    className="feedback-btn feedback-yes" 
                    onClick={handleFeedbackYes}
                  >
                    ✓ Sim
                  </button>
                  <button 
                    className="feedback-btn feedback-no" 
                    onClick={handleFeedbackNo}
                    disabled={atribuidoATecnico}
                    title={atribuidoATecnico ? 'Este chamado já foi atribuído a um técnico' : ''}
                  >
                    ✗ Não
                  </button>
                </div>
              ) : feedbackGiven || chamadoBloqueado ? (
                <div className="feedback-thanks">
                  {feedbackGiven ? 'Obrigado pelo feedback!' : 'Chamado concluído'}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
      
      <ConfirmarResolucaoModal
        isOpen={showModal}
        onConfirm={handleConfirmResolucao}
        onCancel={handleCancelResolucao}
      />
    </div>
  );
}

export default ChatMessage;
