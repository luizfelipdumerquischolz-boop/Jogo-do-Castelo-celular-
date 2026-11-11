# Formulário digital: Minha escola, um jardim de possibilidades

Versão on-line do questionário em papel (Clínica Jurídica III, Curso de Direito UNIVILLE).

- **Link do site:** https://luizfelipdumerquischolz-boop.github.io/Jogo-do-Castelo-celular-/formulario/
  - Versão completa (13 perguntas): `.../formulario/completo.html`
  - Versão com carinhas (5 perguntas): `.../formulario/carinhas.html`
- **Banco de dados:** uma planilha do Google, que é sua. Cada resposta vira uma linha,
  e cada versão fica numa aba separada. Para baixar, use Arquivo > Fazer download > Excel ou CSV.

O site já vai para o ar sozinho a cada atualização da branch `main`, junto com o jogo.
Ele não pede nome nem login, então as respostas são anônimas.

## Ligar a planilha (uma vez só, uns 5 minutos)

1. Entre em https://sheets.new com a sua conta Google. Isso cria uma planilha nova.
   Dê um nome a ela, por exemplo *Respostas: Jardim de possibilidades*.
2. No menu, abra **Extensões > Apps Script**.
3. Apague o que estiver no editor. Cole todo o conteúdo do arquivo
   [`planilha-apps-script.gs`](planilha-apps-script.gs). Depois clique no disquete para salvar.
4. Clique em **Implantar > Nova implantação**.
   - Na engrenagem de "Selecione o tipo", escolha **App da Web**.
   - Em "Executar como", deixe **Eu**.
   - Em "Quem pode acessar", escolha **Qualquer pessoa**. Isso é necessário para que os alunos
     consigam enviar sem login. Eles só conseguem *adicionar* respostas, não *ler* a planilha.
   - Clique em **Implantar** e autorize com a sua conta. O Google vai mostrar um aviso de
     "app não verificado": clique em *Avançado > Acessar (não seguro)*. O app é seu.
5. Copie o **URL do app da Web** (termina em `/exec`).
6. Abra o arquivo [`config.js`](config.js) e cole o URL entre as aspas de `urlPlanilha`:

   ```js
   window.FORMULARIO_CONFIG = {
     urlPlanilha: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   };
   ```

   Se preferir, mande o URL para o Claude que ele faz essa troca.
7. Quando a mudança chegar na `main`, o site se atualiza sozinho em 1 ou 2 minutos.

Para testar se o banco está no ar, abra o URL `/exec` no navegador. Deve aparecer
`"Banco de dados do formulário funcionando."`.

## Como funciona

| Arquivo | O que é |
| --- | --- |
| `index.html` | Página inicial, onde se escolhe a versão |
| `completo.html` / `carinhas.html` | Os dois questionários |
| `perguntas.js` | O texto das perguntas e das opções. Edite aqui para mudar o formulário |
| `app.js` | Monta o formulário e envia as respostas |
| `config.js` | O endereço da planilha |
| `planilha-apps-script.gs` | O código que roda no Google e grava as respostas |

- **Sem internet na escola?** A resposta fica guardada no aparelho e é enviada sozinha quando a
  conexão voltar. O site mostra um aviso com quantas respostas estão esperando.
- **Vários alunos no mesmo tablet:** depois de enviar, toque em *Responder de novo*.
- **Pergunta sem resposta:** o site marca em amarelo e avisa uma vez. Se tocar em *Enviar* de novo,
  a resposta vai assim mesmo, como no papel.
- **Respostas duplicadas:** cada envio tem um ID, e a planilha ignora um ID repetido.
- **Mudou o texto de uma pergunta?** Edite `perguntas.js`. Se criar uma pergunta nova
  (com um `id` novo), a planilha ganha uma coluna nova sozinha.
