# Formulário digital: Minha escola, um jardim de possibilidades

Versão on-line do questionário em papel (Clínica Jurídica III, Curso de Direito UNIVILLE).

- **Site:** um site estático e gratuito no GitHub Pages. Não pede nome nem login, então as respostas são anônimas.
  - `index.html`: página inicial, onde se escolhe a versão
  - `completo.html`: versão completa (13 perguntas)
  - `carinhas.html`: versão com carinhas (5 perguntas)
- **Banco de dados:** a planilha *Respostas – Minha escola: um jardim de possibilidades* no Google Drive
  (https://docs.google.com/spreadsheets/d/1XYREX8VbYhJFDUv93jLbveAzc7nKN0jmxi9tutEh2Dk/edit).
  Cada resposta vira uma linha, e cada versão fica numa aba. Para baixar, use Arquivo > Fazer download.

## Ligar o site à planilha (uma vez só)

O site roda no celular dos alunos, que não têm acesso ao seu Google. Por isso, entre o site e a
planilha existe um pequeno "porteiro" gratuito do Google (Apps Script). Ele só sabe *adicionar*
linhas na planilha e não deixa ninguém ler as respostas.

1. Abra https://script.new, já logado na conta Google dona da planilha.
2. Apague o que estiver no editor e cole todo o conteúdo de [`planilha-apps-script.gs`](planilha-apps-script.gs).
   Clique no disquete para salvar e dê um nome ao projeto, como *Porteiro do formulário*.
3. Clique em **Implantar > Nova implantação**. Na engrenagem, escolha **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Clique em **Implantar**, depois em **Autorizar acesso**, e escolha a sua conta.
   No aviso "O Google não verificou este app", clique em *Avançado > Acessar (não seguro)* e em *Permitir*.
   O app é seu, e o aviso aparece para qualquer script pessoal.
5. Copie o **URL do app da Web** (termina em `/exec`) e coloque em [`config.js`](config.js), ou mande para o Claude.

Para conferir se está funcionando, abra o URL `/exec` no navegador. Deve aparecer
`"Banco de dados do formulário funcionando."`.

## Detalhes

| Arquivo | O que é |
| --- | --- |
| `perguntas.js` | O texto das perguntas e das opções. Edite aqui para mudar o formulário |
| `app.js` | Monta o formulário e envia as respostas |
| `config.js` | O endereço do porteiro (Apps Script) |
| `estilo.css`, `img/` | O visual, com os logos e a foto da árvore do PDF original |
| `planilha-apps-script.gs` | O código do porteiro, que fica no Google |

- **Sem internet na escola?** A resposta fica guardada no aparelho e é enviada sozinha quando a conexão voltar.
- **Vários alunos no mesmo tablet:** depois de enviar, toque em *Responder de novo*.
- **Pergunta sem resposta:** o site marca em amarelo e avisa uma vez. Se tocar em *Enviar* de novo,
  a resposta vai assim mesmo, como no papel.
- **Respostas duplicadas:** cada envio tem um ID (coluna B, escondida), e a planilha ignora um ID repetido.
- **Mudou uma pergunta?** Edite `perguntas.js`. Se mudar o campo `coluna`, a planilha cria uma coluna nova sozinha.
