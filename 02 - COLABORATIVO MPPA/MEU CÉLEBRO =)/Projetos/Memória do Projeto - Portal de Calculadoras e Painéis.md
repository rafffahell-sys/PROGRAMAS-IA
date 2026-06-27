---
tipo: documentação / memória
área: trabalho / MPPA
assunto: Portal de Ferramentas da Folha & Painéis
atualizado: 2026-06-24
tags:
  - projeto
  - documentacao
  - mppa
  - folha
  - calculadoras
  - painel-de-tarefas
---

# 📋 Memória do Projeto: Portal de Calculadoras e Painel de Agentes

Esta documentação serve como registro técnico e funcional completo da reestruturação visual e lógica realizada no portal de ferramentas de Folha de Pagamento do MPPA (**PROGRAMAS-IA**). 

---

## 🌌 1. Diretrizes de Design & Identidade Visual

Todo o portal e seus submódulos foram unificados sob um design system **Dark Mode Glassmorphism** de última geração. O objetivo foi eliminar a disparidade visual anterior e criar um ecossistema coeso que proporciona uma experiência de uso premium e ergonômica.

### Especificações Técnicas do Tema
*   **Tipografia:** Fonte **Outfit** (Google Fonts), com pesos variando de `300` (leve) a `800` (extra-negrito) para garantir legibilidade e hierarquia moderna.
*   **Atmosfera de Fundo (`body`):** Tom escuro profundo `#0b0f19` complementado por dois gradientes radiais suaves — Indigo (`rgba(99, 102, 241, 0.05)`) no canto superior esquerdo e Cyan (`rgba(6, 182, 212, 0.05)`) no canto inferior direito — conferindo percepção de profundidade luminosa.
*   **Efeito Glassmorphism (`.card`):** Fundo translúcido `rgba(17, 24, 39, 0.7)` associado a um desfoque de fundo (`backdrop-filter: blur(12px)`) e bordas finas semi-transparentes (`rgba(255, 255, 255, 0.08)`).
*   **Contraste & Esquema de Cores:**
    *   `--primary` (Índigo): `#6366f1` (Ações principais / Botões)
    *   `--success` (Esmeralda): `#10b981` (Conclusões / Sucesso / Valores positivos)
    *   `--warning` (Âmbar): `#f59e0b` (Alertas / Prazos pendentes / Pendências)
    *   `--danger` (Carmim): `#ef4444` (Erros / Descontos / Exclusões)
    *   `--info` (Ciano): `#06b6d4` (Seções / Destaques informativos)

---

## 🔒 2. Painel de Tarefas (`painel de tarefas2.html`)

O **Painel de Tarefas** é a aplicação central para o monitoramento mensal da folha de pagamento. Ele armazena localmente o status de cada item da folha e possui regras lógicas rígidas para evitar perda de dados históricos e garantir a consistência das operações.

### 🌟 Regra Crítica de Imutabilidade (Segurança Extra)
Para evitar que acessos concorrentes em celulares ou outros dispositivos sobresscrevam ou limpem o status de tarefas concluídas, foi aplicada a seguinte regra:
> [!IMPORTANT]
> **Imutabilidade de Tarefas Concluídas:** Após o usuário selecionar o status de uma tarefa como "Concluído" e confirmar o salvamento, **a tarefa torna-se visual e logicamente imutável na interface**. O seletor de status fica bloqueado (disabled) e não pode ser alterado em nenhuma hipótese pelo portal. Caso seja estritamente necessário modificar o status de uma tarefa concluída, a alteração deverá ser feita diretamente na estrutura de dados interna (via console/desenvolvedor ou no código fonte).

### 📅 Regras de Apresentação e Datas Limite
*   **Abertura Inteligente:** Ao carregar a aplicação, o portal detecta a data atual do sistema e exibe imediatamente a competência corrente (ex: se o acesso for em `Junho/2026`, o painel já carrega e filtra os dados de `Junho/2026`).
*   **eSocial e DCTFWeb:** O calendário considera como data limite de transmissão o **dia 5 do mês subsequente** ao trabalhado.
*   **Inserção Dinâmica:** Interface simplificada integrada na aplicação para criação de novas tarefas personalizadas no mesmo padrão visual.
*   **Responsáveis Cadastrados:** Ronilson, Marialva, Socorrinho (adicionados no seletor padrão).

---

## 🤖 3. Painel de Agentes (`painel_agentes.html`)

Anteriormente denominado "Painel de Agentes MPPA", o nome foi simplificado para **Painel de Agentes** e a nomenclatura de todos os robôs foi padronizada sob o prefixo **Agente** (ex: *Agente de Diárias*, *Agente QDIP*, *Agente do Abono de Permanência*).
*   **Objetivo:** Acompanhamento compartilhado do andamento de automações críticas da folha de pagamento.
*   **Sincronização:** Utiliza a API `KeyValue` para espelhar em tempo real os status marcados por diferentes membros da equipe (Rafael, Giovane, Tati) através de uma chave secreta de sincronia.
*   **Recurso de Copiar Rubricas:** O card do *Agente do Abono de Permanência* contém uma seção dedicada para a emissão de relatórios de auditoria no MENTORH, contendo as rubricas `1055;1062;1215;5201;5203;5197;1431;1183;1032;3135;5157;5198;5199;5197;1297;1183`. Um botão interativo **"Copiar"** foi incorporado para transferir essa sequência de rubricas instantaneamente para a área de transferência do usuário, facilitando o uso rápido no sistema de folha.
*   **Layout:** Recebeu a unificação completa dos estilos escuros e um rodapé padronizado.

---

## 🧮 4. Módulos de Cálculo e Auditoria (Lógica Preservada)

Cada um dos 7 módulos a seguir teve toda a sua estrutura de estilos (CSS) reformulada para o padrão Dark Mode Glassmorphic, garantindo que não houvesse **nenhuma interferência** nas lógicas matemáticas e fluxos de manipulação de dados existentes.

### 1. Calculadora ATS Servidores (`calculadora_ats.html`)
*   **Função:** Calcula o percentual de Adicional por Tempo de Serviço com base em datas de início/fim e ajustes de averbações/descontos.
*   **Mudança:** Estilização escura de inputs de data, tabela de resultados tabulados e botão voltar padrão.

### 2. Calculadora ATS Membros (`calculadora_membro_lote.html`)
*   **Função:** Realiza cálculos de quinquênios e abonos de permanência para membros do Ministério Público em lotes, processando dados colados.
*   **Mudança:** Customização das áreas de colagem de texto (textareas), tabelas de dados estruturados e preservação da importação em lote.

### 3. Simulador de Contracheque (`Simulador_de_Contracheque.html`)
*   **Função:** Simulador completo de vencimentos, vantagens, descontos de imposto de renda progressivo, previdência pública e previdência complementar.
*   **Mudança:** Design unificado, cards de resultados organizados por cores (verde para proventos, vermelho para descontos), e rodapé conjunto.

### 4. Calculadora INSS (`Calculadora INSS.html`)
*   **Função:** Efetua o cálculo direto das alíquotas progressivas do RGPS e a simulação de INSS Reverso.
*   **Mudança:** Cards responsivos, inputs de valores monetários no visual escuro e botões luminosos.

### 5. Calculadora RRA (`calculadora_rra.html`)
*   **Função:** Efetua o cálculo complexo de Rendimentos Recebidos Acumuladamente e apuração de imposto de renda correspondente.
*   **Mudança:** Correção de uma duplicidade de divs no container principal e aplicação de contraste adequado no relatório de resultados.

### 6. Verificador de Matrículas Repetidas (`auditoria-matriculas.html`)
*   **Função:** Identifica matrículas duplicadas em arquivos brutos ou listas inseridas pelo usuário.
*   **Mudança:** Textareas estilizados, alertas luminosos de duplicidades encontradas e performance mantida.

### 7. Calculadora PREVCOM (`PREVCOM.html`)
*   **Função:** Calcula a base de cálculo para a previdência complementar (Base 47) deduzindo o teto da previdência (atualmente R$ 8.475,55) e aplicando as alíquotas selecionadas.
*   **Mudança:** Inclusão de botão de navegação superior, destaque em verde nas rubricas válidas da Base 47 e assinatura padronizada.

---

## 🛠️ 5. Links de Navegação e Rodapés Padronizados

Todos os arquivos possuem:
1.  **Botão de Retorno:** `<a href="index.html" class="back-button">← Voltar ao Portal</a>` no topo de cada módulo para assegurar a livre navegabilidade.
2.  **Assinatura nos Rodapés:** Padronização nos rodapés reforçando a autoria conjunta e o motor de inteligência artificial de desenvolvimento:
    *   `Desenvolvido por Rafael F. Lima, via Google Antigravity IA Agent.`
    *   `By Rafael F. Lima & Giovane Moura · Desenvolvido via Google Antigravity IA Agent · 2026` (Portal)

---

## 🚀 6. Publicação em Produção

O projeto é hospedado via **GitHub Pages** e pode ser acessado publicamente em:
👉 [https://rafffahell-sys.github.io/PROGRAMAS-IA/index.html](https://rafffahell-sys.github.io/PROGRAMAS-IA/index.html)

---

## 🔒 7. Sistema de Autenticação (Acesso Restrito)

Adicionado em **20/06/2026** para proteger as informações sensíveis de folha. Apenas **Rafael, Tatiana e Giovane** têm acesso.

### Mecânica
- **`auth-guard.js`** — script executado sincronamente no `<head>` de todas as páginas. Redireciona instantaneamente para `login.html` se não houver sessão ativa (`sessionStorage: mppa_session_active`).
- **`login.html`** — tela premium com seleção de usuário por avatar + validação de senha via **SHA-256** (Web Crypto API). Senha padrão: `mppa2026`.
- [[Configuração do Site rafffahell.com.br]]
- [[Integração Firebase e KeyValue do Portal]]
- [[Repositório PROGRAMAS-IA]]
- [[Pessoal]]
- **Controle de acesso recreativo:** A seção "Jogos" em `index.html` é exibida **somente para o usuário Rafael** — para Tatiana e Giovane o bloco é completamente ocultado.
- **Seção de Ideias & Projetos Compartilhada (Atualização em 24/06/2026):**
  - O bloco de **Ideias & Projetos (Projetos em Andamento & Backlog)** agora é visível para os três logins ativos (Rafael, Tatiana e Giovane).
  - **Filtro de Contexto Pessoal vs. Trabalho:** Os cards de contexto pessoal — **AppCiclismo** e **Agente DCA Cripto** — possuem a classe `rafael-only` e são dinamicamente ocultados via JavaScript quando o usuário logado não for o Rafael.
  - **Cards Compartilhados de Trabalho:** Os cards relativos ao trabalho, como o **Agente do Ponto (Módulo Plantões)** (atualizado para "Em Desenvolvimento") e o novo **Agente de Promoção de Servidores** (desenvolvido pelo Giovane via Codex, também em desenvolvimento), permanecem visíveis para todos.

---

## 🎨 8. Seletor de Temas (Escuro / Claro / Bege)

Adicionado em **20/06/2026**. Botão flutuante discreto fixado no **canto superior esquerdo** em todas as telas.

| Tema | Classe CSS | Paleta |
|---|---|---|
| 🌌 Escuro (padrão) | *(sem classe)* | Deep blue `#0b0f19`, glassmorphism índigo |
| ☀️ Claro | `theme-light` | Cinza azulado `#f1f5f9`, cards brancos translúcidos |
| 🌾 Bege | `theme-beige` | Areia `#faf6f0`, destaques em laranja-queimado |

A preferência é persistida no `localStorage` (`mppa-portal-theme`) e carregada automaticamente na próxima visita.

---

## 🏛️ 9. Marca d'água Contábil (Caduceu Real)

Adicionado em **20/06/2026**. Plano de fundo premium com o **brasão real do Conselho Federal de Contabilidade** (Caduceu com elmo alado e serpentes cruzadas).

- Imagem: `caduceu_contabilidade.png` (fundo transparente, linhas brancas)
- Aplicada via CSS `::before` no `body`, com `position: fixed` e `z-index: -1`
- Filtros adaptativos por tema:
  - **Escuro:** `opacity: 0.04` (sutil, linhas brancas)
  - **Claro:** `filter: invert(1)`, `opacity: 0.08` (linhas escuras)
  - **Bege:** `filter: invert(1) sepia(1) saturate(5) hue-rotate(340deg)`, `opacity: 0.08`

---

## 💾 10. Agente de Backup Mensal

Adicionado em **20/06/2026**. Robô Python que roda automaticamente no último dia de cada mês às 23:50 para realizar o fechamento mensal do Cérebro Digital.

→ Documentação completa: [[Projeto Agente de Backup]]

---

## 🤖 11. Painel de Agentes Pessoais (Rafael)

Adicionado em **20/06/2026**. Painel exclusivo para o usuário Rafael acessível a partir da área Recreativa do portal. Monitora e reúne a "prestação de satisfação" de 8 bots pessoais rodando no Alienware local via integração com a API KeyValue.

→ Documentação completa: [[Projeto Painel de Agentes Pessoais]]

---

## 🔗 Links Relacionados

- [[Projeto Agente de Backup]] — automação de fechamento mensal
- [[Projeto Painel de Agentes Pessoais]] — monitoramento de robôs pessoais de Rafael
- [[Backup do Agendador de Tarefas Windows]] — portabilidade dos bots entre máquinas
- [[Projeto QDIP - IGEPPS]] — agente de auditoria previdenciária
- [[Projeto Painel de Tarefas]] — painel de monitoramento mensal da folha
- [[Trabalho]] — contexto profissional geral
- [[Auditoria Competencia 2026-06]] — primeiro relatório gerado pelo Agente de Backup

---

[[Início|⬅ Voltar para o Início Geral]] | [[Projetos Ativos|📋 Ver todos os Projetos]]
