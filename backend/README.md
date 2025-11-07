# Backend C# - SmartCall

Backend ASP.NET Core Web API para o sistema SmartCall.

## 🚀 Como Executar

### Pré-requisitos
- .NET 9.0 SDK instalado
- API do Gemini rodando em `http://localhost:8001`

### Passos

1. **Restaurar dependências:**
```bash
dotnet restore
```

2. **Executar o projeto:**
```bash
dotnet run
```

A API estará disponível em: `http://localhost:5000`

## 📚 Documentação da API

Acesse a documentação interativa (Swagger):
- **Swagger UI:** `http://localhost:5000/swagger`

## 🗂️ Estrutura do Projeto

```
backend-csharp/
├── Controllers/          # Controladores da API
│   └── ChatController.cs
├── Data/                 # Contexto do banco de dados
│   └── ApplicationDbContext.cs
├── Models/              # Modelos de dados
│   ├── ChatMessage.cs
│   ├── GeminiAnalise.cs
│   └── DTOs/           # Data Transfer Objects
├── Services/           # Serviços de negócio
│   └── GeminiService.cs
├── Migrations/         # Migrations do Entity Framework
└── Program.cs          # Configuração e inicialização
```

## 🔌 Endpoints Principais

### 1. **GET /** - Informações da API
Retorna informações sobre a API e endpoints disponíveis.

### 2. **GET/POST /api/chat/messages/send_message** - Enviar Mensagem
Envia uma mensagem e recebe resposta da IA.

**Request (POST):**
```json
{
  "message": "Meu computador não liga"
}
```

**Response:**
```json
{
  "UserMessage": {
    "Id": 1,
    "Message": "Meu computador não liga",
    "IsUser": true,
    "CreatedAt": "2025-10-20T23:00:00Z"
  },
  "BotResponse": {
    "Id": 2,
    "Message": "**Computador Não Liga**\n\n📋 **Categoria:** Hardware...",
    "IsUser": false,
    "CreatedAt": "2025-10-20T23:00:01Z"
  }
}
```

### 3. **GET /api/chat/messages** - Listar Mensagens
Retorna todas as mensagens do histórico do chat.

### 4. **POST /api/chat/messages/analisar_chamado** - Analisar Chamado
Analisa uma descrição de chamado e retorna a classificação completa.

**Request:**
```json
{
  "descricao": "Impressora não está imprimindo"
}
```

**Response:**
```json
{
  "titulo": "Problema na Impressora",
  "categoria": "Impressoras e Periféricos",
  "prioridade": "Média",
  "sugestao_solucao": "Verifique se a impressora está ligada..."
}
```

## 🔧 Configuração

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=smartcall.db"
  },
  "GeminiApiUrl": "http://localhost:8001"
}
```

### Variáveis de Ambiente (opcional)
- `GeminiApiUrl`: URL da API do Gemini (padrão: http://localhost:8001)

## 🗄️ Banco de Dados

O projeto usa **SQLite** com **Entity Framework Core**.

### Criar/Atualizar Banco
```bash
dotnet ef migrations add NomeDaMigration
dotnet ef database update
```

O banco é criado automaticamente em `smartcall.db` na primeira execução.

## 🔄 Integração com Frontend

Configure o frontend React para apontar para:
```javascript
const API_URL = 'http://localhost:5000/api/chat';
```

## 📦 Pacotes Utilizados

- **Microsoft.EntityFrameworkCore.Sqlite** - ORM e banco de dados
- **Swashbuckle.AspNetCore** - Documentação Swagger
- **Newtonsoft.Json** - Serialização JSON

## 🐛 Troubleshooting

### CORS Error
Certifique-se que o frontend está rodando em `http://localhost:3000` ou `http://localhost:3001`.

### API do Gemini não responde
Verifique se a API FastAPI está rodando em `http://localhost:8001`.

### Erro de compilação
Execute:
```bash
dotnet clean
dotnet restore
dotnet build
```
