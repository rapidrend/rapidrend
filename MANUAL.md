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

## Índice
1. [Instalação](#1-instalação)
   - [Requisitos do Sistema](#11-requisitos-do-sistema)
   - [Instalação em Windows](#12-instalação-em-windows)
   - [Instalação em macOS](#13-instalação-em-macos)
   - [Instalação em Linux](#14-instalação-em-linux-debian)
   - [Configuração Inicial](#15-configuração-inicial)

2. [Interface e Fluxo de Trabalho](#2-interface-e-fluxo-de-trabalho)
   - [Componentes Principais](#21-componentes-principais)
   - [Fluxo Básico](#22-fluxo-básico)

3. [Funcionalidades Avançadas](#3-funcionalidades-avançadas)
   - [Editores Visuais](#31-editores-visuais)
   - [Palavras-Chave](#32-palavras-chave)
   - [Processamento em Lote](#33-processamento-em-lote)

4. [Comandos](#4-comandos)
   - [Redimensionamento](#41-redimensionamento)
   - [Duração](#42-duração)
   - [Legendas](#43-legendas)
   - [Efeitos](#44-efeitos)
   - [Coloração](#45-coloração)
   - [Sobreposição](#46-sobreposição)
   - [Animação](#47-animação)

5. [Palavras-Chave e Funções](#5-palavras-chave-e-funções)
   - [Sintaxe Geral](#51-sintaxe-geral)
   - [Palavras-Chave Disponíveis](#52-palavras-chave-disponíveis)
   - [Funções Disponíveis](#53-funções-disponíveis)
   - [Exemplos](#54-exemplos)

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
1. Transfira o ficheiro `.exe`.  
2. Execute o ficheiro e siga o assistente de instalação. 

![Instalação em Windows](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual1.png)

### 1.3 Instalação em macOS  
1. Transfira o ficheiro `.dmg`.  
2. Arraste `RapidRend.app` para a pasta `Aplicações`.  
3. Na primeira execução:  
   - Clique direito → "Abrir" (contorna restrições de segurança)  
   - Autorize em "Preferências do Sistema → Segurança e Privacidade"  

![Instalação em macOS](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual2.png)

### 1.4 Instalação em Linux (Debian)
1. Transfira o ficheiro `.deb`.  
2. Execute o seguinte comando: 
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

![Aplicação após 1.ª inicialização](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual3.png)

---

## 2. Interface e Fluxo de Trabalho  

### 2.1 Componentes Principais
![Diagrama da interface com áreas numeradas](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual4.png)

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

![Selecionar Comando](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual5.png)

2. **Configurar Argumentos**:  
   - Tipos de campos:  
     - 📁 Ficheiro (arraste/solte ou clique em "Procurar")  
     - 🔢 Número (use slider ou introduza valor)  
     - 🎚️ Opções avançadas (botão "Mais opções…")  

![Configurar Argumentos](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual6.png)

3. **Execução**:  
   - Pressionar o botão "Executar"  
   - Monitorize progresso no painel de tarefas  

![Execução](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual7.png)

4. **Pós-Processamento**:  
   - Pré-visualização da saída  
   - Opções:  
     - 💾 Guardar como...  
     - 📂 Abrir localização  
     - ❌ Eliminar  

![Pós-Processamento](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual8.png)

---

## 3. Funcionalidades Avançadas  

### 3.1 Editores Visuais  
Disponível nos seguintes comandos:
- Recortar
- Perspetiva
- Sobrepor
- Interpolar  

![Editor visual do comando Recortar](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual9.png)

**Atalhos**:  
- `Ctrl + Roda do Rato`: Zoom in/out  
- `Botão do Meio`: Mover imagem  
- `Shift + Arrastar`: Manter proporções  
- `Alt + Arrastar`: Centrar proporções

### 3.2 Palavras-Chave  
Sintaxe especial para gerar conteúdos dinâmicos:  

```plaintext
Exemplo no comando "Legenda":  
Texto: "Bem-vindo a _city!"  
→ Saída: "Bem-vindo a Lisboa!"  
```

**Funções Disponíveis**:  
- `repeat(_country | 3)` → "Portugal Portugal Portugal"  
- `rawrepeat(_color | 2)` → "Vermelho Azul"  
- `declare(ip | ...)` → Cria variáveis temporárias  

![Exemplo de uso de palavras-chave](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual10.png)

### 3.3 Processamento em Lote  
1. Arraste múltiplos ficheiros
2. A aplicação cria tarefas individuais automáticas  
3. Saídas para cada um dos ficheiros  

![Painel com múltiplas tarefas paralelas](https://raw.githubusercontent.com/rapidrend/rapidrend/refs/heads/main/assets/repo/manual11.png)

## 4. Comandos

### 4.1 Redimensionamento
| Comando          | Descrição                                      | Argumentos Principais              |
|------------------|-----------------------------------------------|------------------------------------|
| Redimensionar    | Ajusta para dimensões específicas             | Largura, Altura, Algoritmo         |
| Ampliar         | Aumenta tamanho por multiplicador             | Multiplicador, Direção             |
| Reduzir         | Diminui tamanho por multiplicador             | Multiplicador, Direção             |
| Recortar        | Recorta área específica                       | X, Y, Largura, Altura              |
| Recortar por Proporção | Mantém proporção especificada           | RatioW, RatioH, Origem             |
| Ampliar Zoom    | Aplica zoom com controle                      | Multiplicador, Origem              |
| Reduzir Zoom    | Reduz zoom com controle                       | Multiplicador, Origem              |
| Expandir        | Aumenta área em torno do ficheiro             | Multiplicador, Direção             |
| Contrair        | Reduz área em torno do ficheiro               | Multiplicador, Direção             |
| Ampliar Pixéis  | Escala arte pixelizada                        | Multiplicador, Filtro              |
| Perspetiva      | Corrige/distorce perspectiva                  | Coordenadas dos cantos             |

### 4.2 Duração
| Comando    | Descrição                              | Argumentos Principais              |
|------------|---------------------------------------|------------------------------------|
| Acelerar   | Aumenta velocidade                    | Multiplicador                      |
| Abrandar   | Reduz velocidade                      | Multiplicador                      |
| Cortar     | Remove segmentos                      | Tempo Inicial, Tempo Final         |
| Loop       | Repete conteúdo                       | Número de repetições               |
| Deslocar   | Atraso na reprodução                  | Tempo de deslocamento              |

### 4.3 Legendas
| Comando       | Descrição                              | Argumentos Principais              |
|---------------|---------------------------------------|------------------------------------|
| Legenda       | Adiciona caixa de texto               | Texto, Tamanho, Cor               |
| Meme          | Formato meme com texto superior/inferior | TopText, BottomText, CorBorda   |
| Motivador     | Poster estilo motivacional            | Texto grande, Texto pequeno       |
| Legenda Tenor | Estilo Tenor com bordas               | TopText, BottomText, TamanhoBorda |

### 4.4 Efeitos
| Comando      | Descrição                          | Argumentos Principais              |
|--------------|-----------------------------------|------------------------------------|
| Rodar        | Rotação angular                   | Graus, Cortar                      |
| Reprodução   | Efeitos de playback               | Modo (inverso/bumerangue)          |
| Desfocar     | Aplica desfoque                   | Raio, Força                        |
| Pixelizar    | Efeito pixel art                  | Tamanho dos blocos                 |
| Derreter     | Efeito de derretimento            | Intensidade, Loop                  |
| Extrair Alfa | Isola canal de transparência      | -                                  |

### 4.5 Coloração
| Comando    | Descrição                          | Argumentos Principais              |
|------------|-----------------------------------|------------------------------------|
| Colorir    | Aplica tonalidade                 | Cor RGB, Modo, Dessaturar          |
| Arco-Íris  | Efeito cíclico de cores           | Duração                            |
| Pseudocor  | Mapeamento de cores térmicas      | Predefinição (magma, plasma, etc.) |

### 4.6 Sobreposição
| Comando   | Descrição                          | Argumentos Principais              |
|-----------|-----------------------------------|------------------------------------|
| Sobrepor  | Combina dois ficheiros            | Posição, Dimensões, Tempo          |
| Misturar  | Efeitos de blend                  | Modo (multiplicar, sobrepor, etc.) |
| Mascarar  | Aplica máscara de transparência   | Modo (manter áreas brancas/pretas) |
| Empilhar  | Repete ficheiro em padrão         | Contagem, Direção                  |
| Combinar  | Junta ficheiros lado a lado       | Direção (horizontal/vertical)      |

### 4.7 Animação
| Comando     | Descrição                          | Argumentos Principais              |
|-------------|-----------------------------------|------------------------------------|
| Girar       | Rotação contínua                  | Duração, Cortar                    |
| Bolha       | Efeito ondulante                  | Duração                            |
| Squishy     | Compressão elástica               | Duração                            |
| Saltitante  | Animação com saltos               | -                                  |
| Círculo     | Trajetória circular               | Diâmetro, Duração                  |
| Infinito    | Movimento em ∞                    | Dimensões, Duração                 |
| Transição   | Efeitos entre cenas               | Tipo, Duração, Modo de espera      |
| Interpolar  | Animação keyframe                 | Pontos de controle, Estilo         |

---

## 5. Palavras-Chave e Funções

### 5.1 Sintaxe Geral
- **Separador de argumentos**: `|` (barra vertical com espaços opcionais)
- **Encadeamento**: Funções podem ser aninhadas  
  Ex: `upper(substring(hello world | 0 | 5))` → "HELLO"
- **Variáveis**: Acessadas pelo nome sem prefixo após declaradas

### 5.2 Palavras-Chave Disponíveis
O programa suporta palavras-chave dinâmicas que geram conteúdos automaticamente. Estas são ativadas com prefixo `_`:

| Palavra-Chave | Descrição | Exemplo |
|--------------|-----------|----------------|
| `_animal`    | Retorna um animal aleatório | `Texto: "Vê este _animal!"` → "Vê este tigre!" |
| `_country`    | Retorna um país aleatório | `Texto: "Nasci em _country!"` → "Nasci em França." |
| `_color`    | Retorna uma cor aleatória | `Texto: "Pintei o quadro de _cor."` → "Pintei o quadro de roxo." |
| `_person`    | Retorna um nome de pessoa aleatório | `Texto: "Bom dia, _person!"` → "Bom dia, Verónica!" |
| `_food`    | Retorna uma comida aleatória | `Texto: "Comi este _food."` → "Comi este hambúrger." |

### 5.3 Funções Disponíveis
Funções permitem operações avançadas com argumentos:

#### Funções Básicas
| Função | Sintaxe | Descrição | Exemplo |
|--------|---------|-----------|---------|
| `repeat` | `repeat(phrase \| times)` | Repete uma frase | `repeat(hi \| 3)` → "hi hi hi" |
| `rawrepeat` | `rawrepeat(phrase \| times)` | Repete processando palavras-chave em cada iteração | `rawrepeat(_animal \| 2)` → "leão zebra" |
| `random` | `random(min \| max)` | Número aleatório entre min e max | `random(1 \| 10)` → "7" |
| `if` | `if(condition \| then \| else)` | Avaliação condicional | `if(greaterthan(1 \| 0) \| yes \| no)` → "yes" |

#### Manipulação de Texto
| Função | Sintaxe | Descrição | Exemplo |
|--------|---------|-----------|---------|
| `trim` | `trim(text)` | Remove espaços extras | `trim( hello )` → "hello" |
| `lower` | `lower(TEXT)` | Converte para minúsculas | `lower(HELLO)` → "hello" |
| `upper` | `upper(text)` | Converte para maiúsculas | `upper(hello)` → "HELLO" |
| `substring` | `substring(text \| start \| end)` | Extrai parte do texto | `substring(hello \| 0 \| 2)` → "he" |

#### Operadores Lógicos
| Função | Sintaxe | Descrição | Exemplo |
|--------|---------|-----------|---------|
| `and` | `and(a \| b)` | AND lógico | `and(true \| false)` → "false" |
| `or` | `or(a \| b)` | OR lógico | `or(true \| false)` → "true" |
| `not` | `not(value)` | NOT lógico | `not(true)` → "false" |
| `equal` | `equal(a \| b)` | Igualdade | `equal(1 \| 1)` → "true" |

#### Operações Matemáticos
| Função | Sintaxe | Descrição | Exemplo |
|--------|---------|-----------|---------|
| `math` | `math(expression)` | Avalia expressão matemática | `math(2+3*2)` → "8" |
| `greaterthan` | `greaterthan(a \| b)` | Comparação > | `greaterthan(5 \| 3)` → "true" |
| `lessthan` | `lessthan(a \| b)` | Comparação < | `lessthan(2 \| 5)` → "true" |

#### Variáveis e Controle
| Função | Sintaxe | Descrição | Exemplo |
|--------|---------|-----------|---------|
| `declare` | `declare(name \| value)` | Cria variável | `declare(x \| 5) {x}` → "5" |
| `rawdeclare` | `rawdeclare(name \| value)` | Cria variável com avaliação dinâmica | `rawdeclare(y \| _animal) {y}` → "pássaro" |
| `arg` | `arg(name)` | Acessa argumento do comando | `arg(input)` → "C:\Users\User\Desktop\input.png" |
| `return` | `return(value)` | Retorna valor final | `return(success)` → "success" |

#### Fluxo de Execução
| Função | Sintaxe | Descrição | Exemplo |
|--------|---------|-----------|---------|
| `while` | `while(condition \| action)` | Loop while | `declare(x \| 0) while(lessthan({x} \| 5) \| declare(x \| math({x}+1)))` |
| `dowhile` | `dowhile(action \| condition)` | Loop do-while | `declare(x \| 0) dowhile(declare(x \| math({x}+1)) \| lessthan({x} \| 5))` |
| `command` | `command(name \| args)` | Executa outro comando | `command(blur \| --input arg(input))` |

#### Especiais
| Função | Sintaxe | Descrição | Exemplo |
|--------|---------|-----------|---------|
| `returnfile` | `returnfile(path)` | Retorna um ficheiro como resultado | `returnfile(output.png)` → "output.png" (ficheiro) |
| `match` | `match(text \| pattern)` | Teste de padrão regex | `match(hello \| ^h)` → "true" |
| `replace` | `replace(text \| pattern \| new)` | Substituição regex | `replace(hi \| i \| ello)` → "hello" |

### 5.4 Exemplos
1. **Condicional com variável**:
   ```
   declare(score | 85)
   if(greaterthan({score} | 90) | excellent | if(greaterthan({score} | 80) | good | average))
   ```

2. **Processamento de texto**:
   ```
   replace(Meu animal favorito é _animal | é | foi)
   ```

3. **Loop com contador**:
   ```
   declare(i | 0)
   rawrepeat(declare(i | math({i}+1)) Item: {i} | 5)
   ```