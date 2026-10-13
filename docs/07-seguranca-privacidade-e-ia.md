# Segurança, Privacidade e IA

## 1. Natureza dos dados

O sistema pode armazenar informações pessoais e sensíveis, incluindo:

- Reflexões pessoais;
- Dados de saúde e hábitos;
- Informações sobre medicamentos;
- Dados financeiros;
- Informações sobre relacionamentos e espiritualidade.

Esses dados devem receber proteção adequada desde o MVP.

## 2. Princípios de privacidade

- Coletar apenas os dados necessários;
- Não tornar públicos os registros pessoais;
- Não usar conteúdo pessoal em logs técnicos por padrão;
- Informar claramente o que é armazenado;
- Oferecer exportação dos dados;
- Definir um processo para exclusão;
- Documentar retenção, backups e tratamento de falhas;
- Evitar compartilhar dados com provedores externos sem informar o usuário.

## 3. Segurança

- Autenticação segura;
- Autorização no servidor em toda operação;
- Isolamento de dados por usuário;
- Validação de entradas;
- Proteção contra CSRF, XSS, SQL injection e abuso de endpoints, conforme a arquitetura;
- Gestão segura de chaves e segredos;
- Criptografia em trânsito;
- Criptografia em repouso quando suportada pela infraestrutura;
- Backups protegidos e com política de retenção definida;
- Testes para impedir acesso cruzado entre usuários.

## 4. Medicamentos e limites do sistema

O sistema pode organizar lembretes e registros. Não deve:

- Recomendar medicamentos;
- Alterar doses ou horários prescritos;
- Interpretar interações medicamentosas;
- Apresentar notificações como orientação médica;
- Inferir que uma medicação foi tomada apenas porque um lembrete foi enviado.

Os registros devem representar o que o usuário informou.

## 5. Notificações e conteúdo sensível

O usuário deve poder controlar se recebe e-mails e que tipo de conteúdo aparece neles.

Como e-mail pode ser acessado por terceiros, evitar incluir detalhes sensíveis no texto da notificação. Uma mensagem neutra, com link para a aplicação, reduz a exposição.

## 6. Exportação e exclusão

A exportação deve:

- Ser acessível apenas ao usuário autenticado;
- Incluir os dados documentados;
- Evitar URLs públicas permanentes;
- Ter validade limitada caso use arquivo temporário.

A política de exclusão ainda precisa ser definida. Deve considerar dados ativos, backups e eventuais obrigações legais aplicáveis.

## 7. LGPD

Antes de disponibilizar o sistema a outras pessoas, revisar:

- Papéis de controlador e operador;
- Base legal e finalidade do tratamento;
- Aviso de privacidade;
- Direitos dos titulares;
- Processo de correção, portabilidade e exclusão;
- Uso de provedores de hospedagem, banco de dados e e-mail;
- Transferência internacional de dados, se aplicável;
- Prazos de retenção e tratamento de backups.

Este documento não substitui uma avaliação jurídica.

## 8. IA e RAG futuros

Antes de ativar IA:

1. Definir quais dados podem ser usados.
2. Obter consentimento e explicar a finalidade.
3. Isolar dados e índices por usuário.
4. Permitir desativação e exclusão dos dados derivados.
5. Avaliar retenção e uso por provedores de IA.
6. Mostrar as fontes que sustentam cada insight.
7. Evitar diagnósticos, conclusões determinísticas ou aconselhamento profissional.
8. Apresentar correlações como observações exploratórias, não como causalidade.
9. Testar respostas para reduzir invenções e interpretações excessivas.