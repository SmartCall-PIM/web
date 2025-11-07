import React, { useState } from 'react';
import ChatMessage from './ChatMessage';

function MarkdownDemo() {
  const [showDemo, setShowDemo] = useState(false);

  const demoMessages = [
    {
      text: "Quero ver exemplos de formatação",
      isUser: true
    },
    {
      text: `**Exemplos de Formatação Markdown**

## 📋 Tipos de Formatação

### Texto Básico
- **Negrito** usando \`**texto**\`
- *Itálico* usando \`*texto*\`
- ***Negrito e Itálico*** usando \`***texto***\`
- ~~Riscado~~ usando \`~~texto~~\`

### Listas
**Lista não ordenada:**
* Item 1
* Item 2
  * Sub-item A
  * Sub-item B

**Lista ordenada:**
1. Primeiro passo
2. Segundo passo
3. Terceiro passo

### Código
Código inline: \`console.log('Hello')\`

Bloco de código:
\`\`\`javascript
function resolver() {
  console.log('Problema resolvido!');
}
\`\`\`

### Tabela

| Prioridade | Tempo | SLA |
|------------|-------|-----|
| 🔴 Alta    | 2h    | 95% |
| 🟡 Média   | 8h    | 90% |
| 🟢 Baixa   | 24h   | 85% |

### Links e Citações

> "Suporte técnico excelente faz a diferença!"

[Documentação Completa](https://example.com)

---

*Todos esses elementos são renderizados automaticamente!*`,
      isUser: false
    }
  ];

  if (!showDemo) {
    return (
      <button 
        onClick={() => setShowDemo(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          zIndex: 1000
        }}
      >
        🎨 Demo Markdown
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#f5f7fa',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#1e3a8a' }}>Demo de Markdown</h2>
          <button 
            onClick={() => setShowDemo(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Fechar
          </button>
        </div>
        
        {demoMessages.map((msg, index) => (
          <ChatMessage 
            key={index}
            message={msg.text}
            isUser={msg.isUser}
          />
        ))}
      </div>
    </div>
  );
}

export default MarkdownDemo;
