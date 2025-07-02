<p align="center">
  <img src="https://raw.githubusercontent.com/rapidrend/rapidrend/main/assets/gui/app.svg" alt="RapidRend Logo" width="400">
</p>

<h1 align="center">RapidRend</h1>
<h3 align="center">Manual de Utilizador</h3>

<div align="center">
  <img alt="License" src="https://img.shields.io/badge/License-GPLv3-blue">
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Windows%20|%20macOS%20|%20Linux-green">
</div>

<p align="center">
  <a href="https://github.com/rapidrend/rapidrend/releases">Download</a>
</p>

---

## 1. Instalação  

### 1.1 Requisitos do Sistema  
- **Sistema Operativo**:  
  - Windows 10/11 (64-bit)  
  - macOS 10.15+ (Catalina ou superior)  
  - Linux (Ubuntu 20.04+ ou distribuições compatíveis)  
- **Espaço em Disco**: 500 MB (incluindo dependências)  
- **Memória RAM**: 4 GB mínimo (8 GB recomendado para vídeos)  
- **Dependências Adicionais**:  
  - Node.js 16.x+ (apenas para instalação manual)  
  - FFmpeg 5.0+ (pré-instalado no pacote oficial)  

### 1.2 Instalação em Windows  
1. Transfira o instalador `RapidRend_Setup.exe` do [website oficial](https://rapidrend.vercel.app).  
2. Execute o ficheiro e siga o assistente de instalação.  
3. Opções recomendadas:  
   - ☑ Adicionar atalho ao ambiente de trabalho  
   - ☑ Adicionar ao PATH do sistema  

[Imagem - Assistente de instalação no Windows com opções destacadas]

### 1.3 Instalação em macOS  
1. Transfira o ficheiro `.dmg`.  
2. Arraste `RapidRend.app` para a pasta `Aplicações`.  
3. Na primeira execução:  
   - Clique direito → "Abrir" (contorna restrições de segurança)  
   - Autorize em "Preferências do Sistema → Segurança e Privacidade"  

### 1.4 Instalação em Linux  
```bash
sudo apt install ./RapidRend_0.5.0_amd64.deb
# Resolver dependências se necessário:
sudo apt --fix-broken install
```

### 1.5 Configuração Inicial  
Na primeira execução, a aplicação cria:  
- **Pastas Automáticas**:  
  - Windows: `%APPDATA%\RapidRend\`  
  - macOS/Linux: `~/.config/RapidRend/`  
  - Temporários: `/tmp/RapidRend_<ID>/` (auto-eliminados)  

[Imagem - Estrutura de pastas no explorador de ficheiros]

---

## 2. Interface e Fluxo de Trabalho  

### 2.1 Componentes Principales  
[Imagem - Diagrama da interface com áreas numeradas]  

1. **Barra Lateral**:  
   - Categorias de comandos (Animação, Redimensionamento, etc.)  
   - Barra de pesquisa 🔍  
   - Botões de vista (Favoritos/Recentes)  

2. **Área de Comandos**:  
   - Configuração de argumentos  
   - Pré-visualização de entrada/saída  
   - Botões de ação (Executar/Anular)  

3. **Painel de Tarefas**:  
   - Lista de processos ativos  
   - Progresso e controlos  

### 2.2 Fluxo Básico  
1. **Selecionar Comando**:  
   - Navegue na barra lateral ou use pesquisa  
   - Clique em ícones de estrela ⭐ para favoritos  

2. **Configurar Argumentos**:  
   - Tipos de campos:  
     - 📁 Ficheiro (arraste/solte ou clique em "Procurar")  
     - 🔢 Número (use slider ou introduza valor)  
     - 🎚️ Opções avançadas (botão "Mais opções…")  

[Imagem - Exemplo do comando "Bolha" com argumentos]

3. **Execução**:  
   - Botão verde "Executar"  
   - Monitorize progresso no painel de tarefas  

4. **Pós-Processamento**:  
   - Pré-visualização da saída  
   - Opções:  
     - 💾 Guardar como...  
     - 📂 Abrir localização  
     - ❌ Eliminar  

---

## 3. Funcionalidades Avançadas  

### 3.1 Editores Visuais  
Disponível em comandos como "Recortar" ou "Perspetiva":  

[Imagem - Editor visual com grades e alças de redimensionamento]

**Atalhos**:  
- `Ctrl + Roda do Rato`: Zoom in/out  
- `Botão do Meio`: Mover imagem  
- `Shift + Arrastar`: Manter proporções  

### 3.2 Palavras-Chave  
Sintaxe especial para gerar conteúdos dinâmicos:  

```plaintext
Exemplo no comando "Legenda":  
Texto: "Bem-vindo a _cidade!"  
→ Saída: "Bem-vindo a Lisboa!"  
```

**Funções Disponíveis**:  
- `repetir(_pais | 3)` → "Portugal Portugal Portugal"  
- `rawrepetir(_cor | 2)` → "Vermelho Azul"  
- `declarar(ip | ...)` → Cria variáveis temporárias  

[Imagem - Exemplo de uso de palavras-chave]

### 3.3 Processamento em Lote  
1. Arraste múltiplos ficheiros para campos com ícone 📂  
2. A aplicação cria tarefas individuais automáticas  
3. Saídas numeradas (ex: `output_1.mp4`, `output_2.mp4`)  

[Imagem - Painel com múltiplas tarefas paralelas]

---

## 4. Resolução de Problemas  

### 4.1 Erros Frequentes  
| Sintoma                | Causa Provável               | Solução                          |
|------------------------|-----------------------------|----------------------------------|
| FFmpeg não encontrado  | Caminho incorreto           | Reinstale ou especifique em `Configurações > Ferramentas` |
| Ficheiro inválido      | Formato não suportado       | Converta para MP4/PNG antes de processar |
| Memória insuficiente   | Ficheiro muito grande       | Reduza resolução ou divida o ficheiro |

### 4.2 Registos (Logs)  
Localização dos ficheiros de diagnóstico:  
- Windows: `%APPDATA%\RapidRend\logs\error.log`  
- macOS/Linux: `~/.config/RapidRend/logs/`  

**Como reportar problemas**:  
1. Inclua a versão exata (Menu Ajuda → Sobre)  
2. Anexe ficheiros:  
   - `error.log`  
   - Captura de ecrã do erro  
3. Envie para: suporte@rapidrend.vercel.app  

### 4.3 Reinicialização  
Para resetar configurações:  
1. Feche a aplicação  
2. Elimine a pasta de configurações  
3. Reinicie (será criada nova configuração padrão)  

---

## 5. Anexos  

### 5.1 Atalhos de Teclado  
| Combinação           | Ação                          |
|----------------------|------------------------------|
| Ctrl + O            | Abrir ficheiro               |
| Ctrl + Shift + E    | Editor visual                |
| F5                  | Recarregar pré-visualização  |

### 5.2 Formatos Suportados  
**Entrada**:  
- Vídeo: MP4, MOV, AVI  
- Imagem: PNG, JPG, WEBP  
- Áudio: MP3, WAV  

**Saída**: MP4 (H.264), PNG (transparência)  

[Imagem - Tabela completa de formatos]