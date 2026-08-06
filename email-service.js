/**
 * EMAIL SERVICE - Para Implementação Futura
 *
 * Este arquivo contém exemplos de como implementar o envio de e-mails.
 * Para usar, você precisará de um backend Node.js.
 *
 * OPÇÕES DE IMPLEMENTAÇÃO:
 * 1. Node.js + Nodemailer (recomendado)
 * 2. SendGrid API
 * 3. Mailgun API
 * 4. AWS SES
 * 5. Zapier Webhooks (sem código)
 */

// =============================================================================
// OPÇÃO 1: Node.js + Nodemailer (Backend necessário)
// =============================================================================

/*
INSTALAÇÃO:
npm install nodemailer node-cron express cors

ARQUIVO: server.js
*/

const serverExample = `
const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar transportador de e-mail
const transporter = nodemailer.createTransport({
    service: 'gmail', // ou 'outlook', 'yahoo', etc.
    auth: {
        user: 'seu-email@gmail.com',
        pass: 'sua-senha-de-app' // Use senha de app, não a senha normal
    }
});

// Função para enviar e-mail
async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: '"Professional Tracker" <noreply@thomsonreuters.com>',
            to: to,
            subject: subject,
            html: html
        });
        console.log('E-mail enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return { success: false, error: error.message };
    }
}

// Endpoint para enviar lembrete manual
app.post('/api/send-reminder', async (req, res) => {
    const { email, type } = req.body;

    let subject, html;

    if (type === 'weekly') {
        subject = '🔔 Lembrete: Registro Semanal - Professional Tracker';
        html = getWeeklyReminderHTML();
    } else if (type === 'monthly') {
        subject = '📊 Lembrete: Resumo Mensal - Professional Tracker';
        html = getMonthlyReminderHTML();
    }

    const result = await sendEmail(email, subject, html);
    res.json(result);
});

// Agendar lembrete semanal (toda sexta-feira às 9h)
cron.schedule('0 9 * * 5', async () => {
    console.log('Enviando lembretes semanais...');

    // Em produção, buscar usuários do banco de dados
    const users = [
        { email: 'erik.nascimento@thomsonreuters.com', name: 'EriK' }
    ];

    for (const user of users) {
        await sendEmail(
            user.email,
            '🔔 Lembrete: Registro Semanal',
            getWeeklyReminderHTML(user.name)
        );
    }
});

// Agendar lembrete mensal (todo dia 28 às 14h)
cron.schedule('0 14 28 * *', async () => {
    console.log('Enviando lembretes mensais...');

    const users = [
        { email: 'erik.nascimento@thomsonreuters.com', name: 'EriK' }
    ];

    for (const user of users) {
        await sendEmail(
            user.email,
            '📊 Lembrete: Resumo Mensal',
            getMonthlyReminderHTML(user.name)
        );
    }
});

// Templates de e-mail
function getWeeklyReminderHTML(name = 'Colaborador') {
    return \`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #123021; color: white; padding: 30px; text-align: center; }
                .logo { font-size: 24px; font-weight: bold; color: #D64000; }
                .content { background: white; padding: 30px; }
                .button {
                    display: inline-block;
                    background: #D64000;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer { text-align: center; padding: 20px; color: #7A7A7A; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Thomson Reuters</div>
                    <h2>Professional Tracker</h2>
                </div>
                <div class="content">
                    <h2>Olá, \${name}! 👋</h2>

                    <p>Este é o seu lembrete semanal para preencher o <strong>Registro Semanal</strong> no Professional Tracker.</p>

                    <p>📝 <strong>O que registrar:</strong></p>
                    <ul>
                        <li>✅ Principais conquistas da semana</li>
                        <li>🎯 Entregas realizadas</li>
                        <li>📚 Aprendizados</li>
                        <li>⚠️ Desafios enfrentados</li>
                        <li>🔜 Próximos passos</li>
                    </ul>

                    <p>Manter seu registro atualizado ajuda você a:</p>
                    <ul>
                        <li>📊 Acompanhar sua evolução</li>
                        <li>🎯 Preparar-se para reuniões 1:1</li>
                        <li>📈 Gerar avaliações automaticamente</li>
                        <li>💪 Demonstrar seu progresso ao gestor</li>
                    </ul>

                    <center>
                        <a href="http://localhost:8080" class="button">Acessar Professional Tracker</a>
                    </center>

                    <p style="margin-top: 30px; color: #7A7A7A; font-size: 14px;">
                        💡 <em>Dica: Reserve 15 minutos toda sexta para refletir sobre sua semana!</em>
                    </p>
                </div>
                <div class="footer">
                    <p>Este é um lembrete automático do Professional Tracker.</p>
                    <p>Thomson Reuters © 2026</p>
                </div>
            </div>
        </body>
        </html>
    \`;
}

function getMonthlyReminderHTML(name = 'Colaborador') {
    return \`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #123021; color: white; padding: 30px; text-align: center; }
                .logo { font-size: 24px; font-weight: bold; color: #D64000; }
                .content { background: white; padding: 30px; }
                .button {
                    display: inline-block;
                    background: #D64000;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .highlight {
                    background: #F9F7F5;
                    padding: 20px;
                    border-left: 4px solid #D64000;
                    margin: 20px 0;
                }
                .footer { text-align: center; padding: 20px; color: #7A7A7A; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Thomson Reuters</div>
                    <h2>Professional Tracker</h2>
                </div>
                <div class="content">
                    <h2>Olá, \${name}! 📊</h2>

                    <p>O mês está chegando ao fim! É hora de gerar seu <strong>Resumo Mensal</strong> e <strong>Avaliação Periódica</strong>.</p>

                    <div class="highlight">
                        <h3>📋 Checklist Mensal:</h3>
                        <ul style="list-style: none; padding-left: 0;">
                            <li>☐ Revisar todas as entregas do mês</li>
                            <li>☐ Atualizar KPIs finais</li>
                            <li>☐ Adicionar pontos fortes identificados</li>
                            <li>☐ Listar oportunidades de melhoria</li>
                            <li>☐ Gerar Resumo Mensal</li>
                            <li>☐ Criar Avaliação Periódica em PDF</li>
                            <li>☐ Enviar para o gestor</li>
                        </ul>
                    </div>

                    <p>🎯 <strong>Benefícios de manter seu registro atualizado:</strong></p>
                    <ul>
                        <li>✨ Demonstrar seu impacto e valor</li>
                        <li>📈 Facilitar conversas de desenvolvimento</li>
                        <li>💼 Preparar-se para avaliações de desempenho</li>
                        <li>🚀 Identificar oportunidades de crescimento</li>
                    </ul>

                    <center>
                        <a href="http://localhost:8080" class="button">Gerar Resumo Mensal</a>
                    </center>

                    <p style="margin-top: 30px; color: #7A7A7A; font-size: 14px;">
                        💡 <em>Dedique 30 minutos para uma reflexão profunda sobre o mês!</em>
                    </p>
                </div>
                <div class="footer">
                    <p>Este é um lembrete automático do Professional Tracker.</p>
                    <p>Thomson Reuters © 2026</p>
                </div>
            </div>
        </body>
        </html>
    \`;
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Servidor rodando na porta \${PORT}\`);
    console.log('Lembretes agendados:');
    console.log('- Sextas-feiras às 9h: Lembrete semanal');
    console.log('- Dia 28 de cada mês às 14h: Lembrete mensal');
});
`;

// =============================================================================
// OPÇÃO 2: SendGrid API (Serviço externo)
// =============================================================================

/*
INSTALAÇÃO:
npm install @sendgrid/mail

CÓDIGO:
*/

const sendGridExample = `
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('SUA_API_KEY_SENDGRID');

async function sendWeeklyReminder(userEmail, userName) {
    const msg = {
        to: userEmail,
        from: 'noreply@thomsonreuters.com',
        subject: '🔔 Lembrete: Registro Semanal',
        html: getWeeklyReminderHTML(userName)
    };

    try {
        await sgMail.send(msg);
        console.log('E-mail enviado com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
    }
}
`;

// =============================================================================
// OPÇÃO 3: Integração com Frontend (Fetch API)
// =============================================================================

// Adicione isso ao seu app.js
const frontendIntegration = `
// Função para solicitar envio de lembrete (chama o backend)
async function requestEmailReminder(type = 'weekly') {
    try {
        const response = await fetch('http://localhost:3000/api/send-reminder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: APP_DATA.config.userEmail,
                type: type
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('E-mail de lembrete enviado com sucesso!');
        } else {
            showNotification('Erro ao enviar e-mail: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao enviar lembrete:', error);
        showNotification('Erro ao conectar com o servidor de e-mail');
    }
}

// Adicione botão na interface para teste manual
// <button onclick="requestEmailReminder('weekly')">Testar Lembrete Semanal</button>
`;

// =============================================================================
// OPÇÃO 4: Zapier Webhooks (SEM CÓDIGO!)
// =============================================================================

const zapierInstructions = `
PASSO A PASSO ZAPIER (Mais Fácil - Sem Programação):

1. Criar conta no Zapier (zapier.com)

2. Criar novo Zap:
   - Trigger: Schedule by Zapier
   - Configurar: Toda sexta-feira às 9h

3. Ação: Gmail (ou Outlook)
   - Enviar e-mail
   - Para: erik.nascimento@thomsonreuters.com
   - Assunto: 🔔 Lembrete: Registro Semanal
   - Corpo: Usar template HTML acima

4. Ativar o Zap

5. Repetir para lembrete mensal (dia 28 de cada mês)

VANTAGENS:
✅ Não precisa de servidor
✅ Não precisa programar
✅ Interface visual
✅ Gratuito para até 100 tarefas/mês

DESVANTAGENS:
❌ Limite gratuito
❌ Menos controle
❌ Depende de serviço externo
`;

// =============================================================================
// OPÇÃO 5: Google Apps Script (GRÁTIS e FÁCIL!)
// =============================================================================

const googleAppsScriptExample = `
/**
 * MELHOR OPÇÃO PARA VOCÊ: Google Apps Script
 *
 * PASSO A PASSO:
 * 1. Acesse: script.google.com
 * 2. Criar novo projeto
 * 3. Cole o código abaixo
 * 4. Configure os gatilhos (Triggers)
 */

function enviarLembreteSemanl() {
    const destinatario = "erik.nascimento@thomsonreuters.com";
    const assunto = "🔔 Lembrete: Registro Semanal - Professional Tracker";

    const corpo = \`
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background: #123021; color: white; padding: 30px; text-align: center;">
                        <h1 style="color: #D64000; margin: 0;">Thomson Reuters</h1>
                        <h2 style="margin: 10px 0 0 0;">Professional Tracker</h2>
                    </div>

                    <div style="padding: 30px; background: white;">
                        <h2>Olá, EriK! 👋</h2>

                        <p>Este é o seu lembrete semanal para preencher o <strong>Registro Semanal</strong>.</p>

                        <p>📝 <strong>O que registrar:</strong></p>
                        <ul>
                            <li>✅ Principais conquistas da semana</li>
                            <li>🎯 Entregas realizadas</li>
                            <li>📚 Aprendizados</li>
                            <li>⚠️ Desafios enfrentados</li>
                            <li>🔜 Próximos passos</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="file:///C:/Users/6137054/Desktop/recursos/mysql/DOCUMENTOS/TAX%20LAB/Claude%20-%20IA/Avaliacão%20de%20desempenho/professional-tracker/index.html"
                               style="background: #D64000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Acessar Professional Tracker
                            </a>
                        </div>

                        <p style="color: #7A7A7A; font-size: 14px; margin-top: 30px;">
                            💡 <em>Dica: Reserve 15 minutos toda sexta para refletir sobre sua semana!</em>
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px; color: #7A7A7A; font-size: 12px;">
                        <p>Thomson Reuters © 2026</p>
                    </div>
                </div>
            </body>
        </html>
    \`;

    GmailApp.sendEmail(destinatario, assunto, "", {
        htmlBody: corpo,
        name: "Professional Tracker"
    });

    Logger.log("Lembrete semanal enviado!");
}

function enviarLembreteMensal() {
    const destinatario = "erik.nascimento@thomsonreuters.com";
    const assunto = "📊 Lembrete: Resumo Mensal - Professional Tracker";

    const corpo = \`
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background: #123021; color: white; padding: 30px; text-align: center;">
                        <h1 style="color: #D64000; margin: 0;">Thomson Reuters</h1>
                        <h2 style="margin: 10px 0 0 0;">Professional Tracker</h2>
                    </div>

                    <div style="padding: 30px; background: white;">
                        <h2>Olá, EriK! 📊</h2>

                        <p>O mês está chegando ao fim! É hora de gerar seu <strong>Resumo Mensal</strong>.</p>

                        <div style="background: #F9F7F5; padding: 20px; border-left: 4px solid #D64000; margin: 20px 0;">
                            <h3>📋 Checklist Mensal:</h3>
                            <ul>
                                <li>☐ Revisar todas as entregas do mês</li>
                                <li>☐ Atualizar KPIs finais</li>
                                <li>☐ Adicionar pontos fortes</li>
                                <li>☐ Listar oportunidades</li>
                                <li>☐ Gerar Resumo Mensal</li>
                                <li>☐ Criar Avaliação em PDF</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="file:///C:/Users/6137054/Desktop/recursos/mysql/DOCUMENTOS/TAX%20LAB/Claude%20-%20IA/Avaliacão%20de%20desempenho/professional-tracker/index.html"
                               style="background: #D64000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Gerar Resumo Mensal
                            </a>
                        </div>
                    </div>

                    <div style="text-align: center; padding: 20px; color: #7A7A7A; font-size: 12px;">
                        <p>Thomson Reuters © 2026</p>
                    </div>
                </div>
            </body>
        </html>
    \`;

    GmailApp.sendEmail(destinatario, assunto, "", {
        htmlBody: corpo,
        name: "Professional Tracker"
    });

    Logger.log("Lembrete mensal enviado!");
}

/**
 * CONFIGURAR GATILHOS (Triggers):
 *
 * 1. No menu, clique em "Gatilhos" (ícone de relógio)
 * 2. Criar novo gatilho para "enviarLembreteSemanl":
 *    - Função: enviarLembreteSemanl
 *    - Evento: Acionador com base em tempo
 *    - Tipo: Semanalmente
 *    - Dia: Sexta-feira
 *    - Horário: 9h - 10h
 *
 * 3. Criar novo gatilho para "enviarLembreteMensal":
 *    - Função: enviarLembreteMensal
 *    - Evento: Acionador com base em tempo
 *    - Tipo: Mensalmente
 *    - Dia: 28
 *    - Horário: 14h - 15h
 *
 * 4. Salvar e autorizar o script
 */
`;

// Exportar exemplos para console
console.log('='.repeat(80));
console.log('EMAIL SERVICE - Guia de Implementação');
console.log('='.repeat(80));
console.log('\n📧 OPÇÕES DISPONÍVEIS:\n');
console.log('1. Node.js + Nodemailer (Controle total)');
console.log('2. SendGrid API (Profissional)');
console.log('3. Zapier Webhooks (Sem código)');
console.log('4. Google Apps Script (RECOMENDADO - Grátis e Fácil!)');
console.log('\n' + '='.repeat(80));
console.log('\n💡 RECOMENDAÇÃO: Use Google Apps Script!');
console.log('\nVantagens:');
console.log('✅ 100% Gratuito');
console.log('✅ Fácil de configurar');
console.log('✅ Não precisa de servidor');
console.log('✅ Integrado com Gmail');
console.log('✅ Interface visual para agendar');
console.log('\nVeja o código completo em googleAppsScriptExample');
console.log('='.repeat(80));

// Função para copiar o código do Google Apps Script
function copyGoogleAppsScriptCode() {
    navigator.clipboard.writeText(googleAppsScriptExample);
    console.log('✅ Código copiado! Cole em script.google.com');
}

// Export para uso no HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        serverExample,
        sendGridExample,
        frontendIntegration,
        zapierInstructions,
        googleAppsScriptExample
    };
}
