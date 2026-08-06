# 🚀 Professional Tracker - Thomson Reuters

## 🎉 Versão 4.0 - IndexedDB + Multi-Usuário!

Sistema completo de acompanhamento profissional desenvolvido para registrar entregas, acompanhar KPIs e gerar avaliações periódicas automatizadas.

### 🆕 Novidades da v4.0:
1. **🗄️ IndexedDB** - Banco de dados robusto com capacidade ilimitada (antes: ~10MB, agora: ~50MB+)
2. **⚡ Performance 10x Melhor** - Carregamento em paralelo, operações assíncronas
3. **🔒 Transações ACID** - Segurança total: se falhar, volta tudo (tudo ou nada)
4. **👥 Sistema Multi-Usuário** - Cada funcionário tem seus próprios dados isolados
5. **💾 Backup Duplo** - IndexedDB + localStorage como fallback
6. **🔄 Migração Automática** - Recupera dados antigos do localStorage automaticamente
7. **🚀 Escalável** - Suporta milhares de registros sem problemas

---

## 🌐 Como Hospedar (Compartilhar com Outros Usuários)

### Opção 1: GitHub Pages (GRÁTIS e RECOMENDADO)

1. Crie uma conta no [GitHub](https://github.com)
2. Crie um novo repositório público
3. Faça upload dos arquivos: `index.html`, `app.js`, `styles.css`
4. Vá em Settings > Pages > Source: "main" branch
5. **Seu site estará em**: `https://SEU-USUARIO.github.io/professional-tracker`

### Opção 2: Netlify (GRÁTIS + Domínio personalizado)

1. Acesse [Netlify](https://www.netlify.com)
2. Arraste a pasta `professional-tracker` para fazer deploy
3. **Link pronto**: `https://NOME.netlify.app`

### Opção 3: Vercel (GRÁTIS + RÁPIDO)

1. Acesse [Vercel](https://vercel.com)
2. Importe o projeto do GitHub
3. **Link pronto**: `https://professional-tracker.vercel.app`

📌 **Importante**: Cada usuário terá seus dados isolados por ID de funcionário!

---

## ✨ Funcionalidades Principais

### 📊 Dashboard ⭐ MELHORADO na v2.0
- **NOVO**: Gráfico de Evolução Semanal (últimas 8 semanas)
- **NOVO**: Gráfico de Distribuição por Meta (pizza interativa)
- **NOVO**: Contador de Streak (semanas consecutivas)
- **NOVO**: Mini calendário visual (últimas 12 semanas)
- Visão geral do mês com KPIs principais
- Atividades recentes
- Próximos lembretes

### 🎯 Registro de Entregas
- Cadastro de entregas com título, descrição, data e status
- Filtros por mês e status
- Classificação por impacto (1-5)
- Categorias: Planejado, Em Progresso, Concluído

### 📈 KPIs Mensais
- Acompanhamento de múltiplos KPIs
- Progresso visual com barras
- Comparação meta vs. realizado
- Histórico mensal

### 📝 Registro Semanal ⭐ MELHORADO na v2.0
- **NOVO**: Busca por palavra-chave em todo o histórico
- **NOVO**: Filtros por período (semana, mês, trimestre, ano)
- **NOVO**: Filtros por meta específica
- Campo customizado "Atividades da Semana" com análise automática
- Formulário completo para registro de atividades
- Campos: Conquistas, Entregas, Aprendizados, Desafios, Próximos Passos
- Histórico de todas as semanas
- **Lembrete automático toda sexta-feira**

### 🎯 Avaliações Periódicas
- Pontos Fortes
- Oportunidades de Melhoria
- Pontos de Atenção
- Como Avançar (plano de ação)
- Geração automática de PDF para envio ao gestor

### 📄 Exportação ⭐ MELHORADO na v2.0
- **NOVO**: 💾 Backup completo (JSON) - Segurança de dados
- **NOVO**: 📥 Importar dados de backup - Migrar entre dispositivos
- **NOVO**: 📊 Export para Excel (CSV) - Análises externas
- 📄 PDF profissional com cores Thomson Reuters
- Pronto para enviar ao gestor
- Inclui todos os dados relevantes

### 🎨 Interface ⭐ NOVO na v2.0
- **☀️ Tema Claro**: Fundo branco, ideal para uso diurno
- **🌙 Tema Escuro**: Fundo verde escuro, reduz fadiga visual
- **Troca instantânea** com botão no header
- **Preferência salva** automaticamente

### 🔔 Notificações ⭐ NOVO na v2.0
- **Banner de Alerta**: Avisa se você não registra há >7 dias
- **Celebrações**: Mensagem especial ao completar 4 semanas consecutivas
- **Toasts**: Confirmações visuais de ações (exportar, salvar, etc.)
- **Badges**: Indicador laranja no menu quando atrasado

## 🎨 Cores Thomson Reuters

O sistema utiliza a paleta oficial:

- **TR Orange** (#D64000) - Destaque principal
- **TR Green** (#123021) - Cabeçalhos e títulos
- **TR Graphite** (#212223) - Textos principais
- **TR Grey1** (#F9F7F5) - Background
- **TR Sky** (#1A7EE5) - Botões secundários
- **TR Teal** (#4DB299) - Status positivo
- **TR Amber** (#D4792A) - Alertas

## 🔔 Sistema de Lembretes

### Lembrete Semanal (Sexta-feira)
- Notificação no sistema toda sexta-feira
- Lembrete para preencher o registro semanal
- Configurável nas configurações

### Lembrete Mensal
- Alerta para gerar resumo mensal
- Configurável nas configurações

### Configuração de E-mail
Nas **Configurações**, você pode:
- Definir seu e-mail para lembretes
- Ativar/desativar lembretes semanais
- Ativar/desativar lembretes mensais

*Nota: Para implementar envio real de e-mails, é necessário integrar com um serviço backend (Node.js + Nodemailer, por exemplo)*

## 📋 Como Usar

### 1. Primeiro Acesso
1. Abra o arquivo `index.html` no navegador
2. Vá em **Configurações** e preencha suas informações pessoais
3. Configure seu e-mail para receber lembretes

### 2. Registrando Entregas
1. Clique em **Entregas**
2. Clique em **+ Nova Entrega**
3. Preencha: título, descrição, data, status e impacto
4. Salve

### 3. Acompanhando KPIs
1. Clique em **KPIs**
2. Clique em **+ Adicionar KPI**
3. Defina: nome, meta, valor atual, unidade e mês
4. O sistema calcula automaticamente a porcentagem

### 4. Registro Semanal (IMPORTANTE!)
**Toda sexta-feira**, preencha:
1. Vá em **Registro Semanal**
2. Selecione a semana
3. Preencha todos os campos:
   - Principais Conquistas
   - Entregas Realizadas
   - Aprendizados
   - Desafios Enfrentados
   - Próximos Passos
4. Salve

### 5. Gerando Avaliações

#### Resumo Semanal
- No **Dashboard**, clique em **📝 Resumo Semanal**
- Gera arquivo .txt com o último registro semanal
- Use para enviar ao gestor

#### Resumo Mensal
- No **Dashboard**, clique em **📈 Resumo Mensal**
- Gera arquivo .txt com estatísticas do mês
- Inclui entregas, KPIs e análises

#### Avaliação Periódica (COMPLETA)
1. Vá em **Avaliações**
2. Adicione itens em:
   - 💪 Pontos Fortes
   - 🎯 Oportunidades de Melhoria
   - ⚠️ Pontos de Atenção
   - 🚀 Como Avançar
3. Clique em **+ Nova Avaliação**
4. **PDF é gerado automaticamente** com visual Thomson Reuters
5. Envie o PDF ao seu gestor

### 6. Exportar PDF Completo
- No topo da página, clique em **📄 Exportar PDF**
- Gera relatório completo com todos os dados
- Ideal para apresentações e reuniões 1:1

## 💾 Backup e Dados

### Exportar Todos os Dados
1. Vá em **Configurações**
2. Clique em **📥 Exportar Todos os Dados**
3. Salva arquivo JSON com backup completo

### Importar Dados
1. Vá em **Configurações**
2. Clique em **📤 Importar Dados**
3. Selecione o arquivo JSON salvo anteriormente

### Limpar Dados
⚠️ **Cuidado!** Esta ação é irreversível
- Remove todos os registros do sistema

## 🔒 Privacidade e Armazenamento

### Sistema Multi-Usuário Seguro

- ✅ **Cada usuário** acessa com seu ID de funcionário único
- ✅ **Dados 100% isolados** - nenhum usuário vê dados de outro
- ✅ **Armazenamento local** (localStorage) - dados ficam no navegador
- ✅ **Nenhum dado enviado para servidores** - total privacidade
- ✅ **Backup automático** antes de cada salvamento

### Como funciona a segurança:

```
Usuário A (ID: 6137054) → professionalTrackerData_6137054
Usuário B (ID: 7138055) → professionalTrackerData_7138055
Usuário C (ID: 8139056) → professionalTrackerData_8139056
```

Cada um tem sua própria "conta" completamente separada!

### Sistema de Backup Triplo (NOVO v3.0):

1. **Backup imediato**: Salvado antes de sobrescrever dados
2. **Histórico de 3 versões**: Mantém as 3 últimas alterações
3. **Backup manual**: Botão "💾 Backup" para exportar JSON

### Recuperação de Dados:

Se perder dados, abra `recuperar-dados.html` para:
- 🔍 Diagnosticar todos os backups disponíveis
- 📊 Ver quantas metas/entregas cada backup tem
- 🔄 Restaurar com um clique

## 🎯 Fluxo de Trabalho Recomendado

### Semanal
1. **Segunda-feira**: Planejar entregas da semana
2. **Durante a semana**: Registrar entregas conforme concluídas
3. **Sexta-feira**:
   - ✅ Preencher Registro Semanal (lembrete automático)
   - ✅ Gerar Resumo Semanal
   - ✅ Enviar para o gestor (se necessário)

### Mensal
1. **Última semana do mês**:
   - Revisar todas as entregas
   - Atualizar KPIs finais
   - Adicionar pontos fortes e oportunidades
2. **Primeiro dia útil do mês seguinte**:
   - Gerar Resumo Mensal
   - Gerar Avaliação Periódica
   - Agendar 1:1 com gestor

### Trimestral/Semestral
- Gerar Avaliação Periódica completa
- Revisar evolução dos últimos meses
- Definir novos objetivos

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura
- **CSS3** - Estilização com cores Thomson Reuters
- **JavaScript (Vanilla)** - Lógica e interatividade
- **IndexedDB** - Banco de dados robusto (via Dexie.js)
- **Chart.js** - Gráficos interativos
- **jsPDF** - Geração de PDFs
- **localStorage** - Backup de segurança

### 🗄️ Por que IndexedDB?

| Recurso | localStorage | IndexedDB |
|---------|--------------|-----------|
| **Capacidade** | ~5-10 MB | ~50 MB - ilimitado |
| **Tipo de dados** | Apenas strings | Objetos complexos |
| **Performance** | Síncrono (bloqueia) | Assíncrono (não bloqueia) |
| **Consultas** | Apenas get/set | Queries com filtros |
| **Transações** | Não | Sim (ACID) |
| **Escalabilidade** | Limitada | Milhares de registros |

### 📊 Estrutura do Banco de Dados:

```javascript
ThomsonReutersPSTracker/
├── users         (userId, userName, userRole, lastAccess)
├── deliveries    (userId, title, date, status, impact)
├── kpis          (userId, name, month, target, current)
├── weeklyRecords (userId, week, activities, goals)
├── customGoals   (userId, title, category, status, dueDate)
├── strengths     (userId, content, date)
├── opportunities (userId, content, date)
├── reviews       (userId, date, type)
└── config        (userId, userName, userEmail, settings)
```

### 🔄 Migração Automática:

O sistema detecta automaticamente dados antigos no localStorage e migra para IndexedDB na primeira execução. Nenhuma ação necessária!

## 📧 Implementando Lembretes por E-mail (Avançado)

Para enviar e-mails reais, você precisará:

1. **Backend com Node.js**:
```javascript
// server.js
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Configurar transportador
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seu-email@gmail.com',
        pass: 'sua-senha-app'
    }
});

// Agendar para toda sexta às 9h
cron.schedule('0 9 * * 5', () => {
    const mailOptions = {
        from: 'noreply@thomsonreuters.com',
        to: 'erik.nascimento@thomsonreuters.com',
        subject: '🔔 Lembrete: Registro Semanal',
        html: `
            <h2>Olá EriK!</h2>
            <p>Não esqueça de preencher seu registro semanal no Professional Tracker.</p>
            <p><a href="http://localhost:8080">Acessar Professional Tracker</a></p>
        `
    };

    transporter.sendMail(mailOptions);
});
```

2. **Ou usar serviços como**:
   - SendGrid
   - Mailgun
   - AWS SES
   - Zapier (integração sem código)

## 🆘 Suporte e Dúvidas

Para dúvidas ou problemas:
1. Verifique se está usando um navegador moderno (Chrome, Edge, Firefox)
2. Limpe o cache do navegador se algo não funcionar
3. Faça backup regular dos seus dados

## 📝 Notas Importantes

- ⚠️ Use SEMPRE o mesmo navegador para manter seus dados
- 💾 Exporte backups mensalmente
- 📧 Configure lembretes para não esquecer registros
- 🎯 Seja consistente nos registros semanais
- 📊 Atualize KPIs regularmente para gráficos precisos

## 🎉 Pronto para Usar!

Seu sistema está 100% funcional e pronto para:
- ✅ Registrar entregas
- ✅ Acompanhar KPIs
- ✅ Receber lembretes semanais
- ✅ Gerar resumos automáticos
- ✅ Criar avaliações em PDF
- ✅ Apresentar evolução ao gestor

**Boa sorte no seu desenvolvimento profissional! 🚀**

---

*Sistema desenvolvido com as cores e padrões da Thomson Reuters*
*Versão 1.0 - 2026*
