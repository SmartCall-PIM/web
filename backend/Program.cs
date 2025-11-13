using System.Text;
using Backend.CSharp.Data;
using Backend.CSharp.Models;
using Backend.CSharp.Services;
using Backend.CSharp.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Configuração do CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000", 
                "http://localhost:3001",
                "http://10.0.2.2:8000",  // Android Emulator
                "http://192.168.1.64:8081", // Expo Dev Server
                "https://delightful-cliff-0d4555a0f.3.azurestaticapps.net" // Azure Static Web App
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configuração do Entity Framework com SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configuração do Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Configurações de senha - apenas mínimo 6 caracteres
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;

    // Configurações de usuário
    options.User.RequireUniqueEmail = true;
    
    // Configurações de lockout
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configuração do JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your-super-secret-key-change-this-in-production-minimum-32-characters";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SmartCallAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SmartCallClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Registra o HttpClient para o GeminiService com timeout e configuração
builder.Services.AddHttpClient<GeminiService>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var geminiUrl = configuration["GeminiApiUrl"] ?? "http://localhost:8001";
    
    client.BaseAddress = new Uri(geminiUrl);
    client.Timeout = TimeSpan.FromSeconds(60);
});

// Registra o GeminiService
builder.Services.AddScoped<GeminiService>();

// Registra o TypingStatusService como Singleton (compartilhado entre todas as requisições)
builder.Services.AddSingleton<TypingStatusService>();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Mantém PascalCase
        // Serializa DateTime em formato UTC com sufixo 'Z'
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Swagger para documentação da API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Aplica migrations automaticamente
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Endpoint raiz com informações da API
app.MapGet("/", () => Results.Ok(new
{
    message = "SmartCall API - Backend C#",
    version = "1.0",
    endpoints = new
    {
        admin = "/swagger",
        chat = new
        {
            messages = "/api/chat/messages",
            send_message = "/api/chat/messages/send_message",
            analisar_chamado = "/api/chat/messages/analisar_chamado"
        }
    }
})).WithName("Root");

app.UseCors("AllowFrontend");

// app.UseHttpsRedirection(); // Comentado para desenvolvimento local

app.UseAuthentication();

// Middleware para validar se o usuário ainda existe (antes de autorização)
app.UseUserValidation();

app.UseAuthorization();

app.MapControllers();

app.Run();

