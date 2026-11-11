// Perguntas do formulário "Minha escola: um jardim de possibilidades".
// Cada pergunta tem um "id", que vira o nome da coluna na planilha.
// tipo: 'uma' (só uma bolinha), 'varias' (vários quadradinhos), 'texto', 'carinha'.
window.FORMULARIOS = {
  completo: {
    titulo: 'Minha escola: um jardim de possibilidades',
    subtitulo: 'O que você achou do nosso projeto?',
    aba: 'Versão completa',
    intro:
      'Oi! Queremos saber o que você achou dos encontros com os estudantes de Direito da UNIVILLE. ' +
      'Não escreva seu nome em nenhum lugar. Não existe resposta certa ou errada e ninguém vai ganhar nota por isso. ' +
      'Se tiver dúvida, pode pedir ajuda ao professor.',
    partes: [
      {
        titulo: 'Parte 1. Sua participação',
        perguntas: [
          {
            id: 'p01_encontros',
            texto: 'De quais encontros você participou?',
            tipo: 'varias',
            opcoes: [
              'A apresentação, com os vídeos e a dinâmica “Se você me conhecesse bem, você saberia que...”',
              'A produção dos desenhos, pinturas e textos',
              'A montagem e a entrega da árvore',
            ],
          },
          {
            id: 'p02_como_participou',
            texto: 'Como você participou?',
            tipo: 'varias',
            opcoes: [
              'Desenhei ou pintei',
              'Escrevi um texto, uma frase ou um poema',
              'Fiz colagem ou decorei',
              'Ajudei a montar a árvore',
              'Ajudei um colega',
              'Preferi só acompanhar',
            ],
          },
        ],
      },
      {
        titulo: 'Parte 2. Como você se sentiu',
        perguntas: [
          {
            id: 'p03_como_se_sentiu',
            texto: 'Como você se sentiu durante os encontros?',
            tipo: 'uma',
            opcoes: ['Muito bem', 'Bem', 'Mais ou menos', 'Não me senti bem'],
          },
          {
            id: 'p04_a_vontade',
            texto: 'Você se sentiu à vontade para se expressar do seu jeito?',
            tipo: 'uma',
            opcoes: ['Sim', 'Mais ou menos', 'Não'],
          },
          {
            id: 'p05_ideias_ouvidas',
            texto: 'Você sentiu que as suas ideias e opiniões foram ouvidas?',
            tipo: 'uma',
            opcoes: ['Sim', 'Mais ou menos', 'Não'],
          },
          {
            id: 'p06_outra_turma',
            texto: 'Como foi fazer a atividade junto com alunos de outra turma?',
            tipo: 'uma',
            opcoes: ['Gostei muito', 'Gostei', 'Tanto faz', 'Não gostei'],
          },
        ],
      },
      {
        titulo: 'Parte 3. O que ficou com você',
        perguntas: [
          {
            id: 'p07_jeitos_diferentes',
            texto:
              'Depois do projeto, você entende melhor que cada pessoa tem um jeito diferente de aprender, de sentir e de se comunicar?',
            tipo: 'uma',
            opcoes: ['Sim, entendo melhor', 'Um pouco', 'Continua igual para mim'],
          },
          {
            id: 'p08_direitos',
            texto: 'Quais destes direitos você lembra de ter visto no projeto?',
            tipo: 'varias',
            opcoes: [
              'Ser respeitado do jeito que eu sou',
              'Sentir que faço parte do grupo',
              'Estudar e participar de verdade',
              'Ser ouvido e dar a minha opinião',
              'Não lembro',
            ],
            exclusiva: 'Não lembro',
          },
          {
            id: 'p09_parte_da_escola',
            texto: 'Depois do projeto, você se sente mais parte da sua escola?',
            tipo: 'uma',
            opcoes: ['Sim, mais do que antes', 'Igual a antes', 'Menos do que antes'],
          },
          {
            id: 'p10_colega_de_fora',
            texto: 'Se você visse um colega ficando de fora, o que faria hoje?',
            tipo: 'uma',
            opcoes: [
              'Chamaria para participar comigo',
              'Avisaria um professor ou outro adulto',
              'Ainda não sei o que faria',
              'Não faria nada',
            ],
          },
        ],
      },
      {
        titulo: 'Parte 4. A árvore e o projeto',
        perguntas: [
          {
            id: 'p11_trabalho_na_arvore',
            texto: 'Você reconhece o seu trabalho na árvore que ficou na entrada da escola?',
            tipo: 'uma',
            opcoes: ['Sim, e tenho orgulho dele', 'Sim', 'Não encontrei', 'Não fiz um trabalho para a árvore'],
          },
          {
            id: 'p12_mais_projetos',
            texto: 'Você gostaria que a escola tivesse mais projetos como este?',
            tipo: 'uma',
            opcoes: ['Sim', 'Talvez', 'Não'],
          },
        ],
      },
      {
        titulo: '13. Conte para a gente, do seu jeito',
        nota: 'Não é obrigatório. Escreva só se quiser, sem colocar nomes.',
        perguntas: [
          { id: 'p13a_mais_gostou', texto: 'O que você mais gostou?', tipo: 'texto', opcional: true },
          { id: 'p13b_poderia_melhorar', texto: 'O que poderia ser diferente ou melhor?', tipo: 'texto', opcional: true },
          {
            id: 'p13c_aprendi',
            texto: 'Uma coisa que eu aprendi e quero levar comigo:',
            tipo: 'texto',
            opcional: true,
          },
        ],
      },
    ],
    fim: 'Obrigado por participar! Todos pertencemos à escola.',
  },

  carinhas: {
    titulo: 'Minha escola: um jardim de possibilidades',
    subtitulo: 'Versão com carinhas',
    aba: 'Versão com carinhas',
    intro:
      'Para o adulto que aplica: leia cada pergunta em voz alta. O aluno toca na carinha que escolher, ' +
      'ou aponta e o adulto marca. Não escreva o nome do aluno. ' +
      'Estas perguntas correspondem às de número 3, 4, 6, 11 e 12 da versão completa.',
    partes: [
      {
        perguntas: [
          { id: 'c1_gostou', texto: 'Você gostou dos encontros?', tipo: 'carinha', opcoes: ['Gostei', 'Mais ou menos', 'Não gostei'] },
          { id: 'c2_do_seu_jeito', texto: 'Você pôde fazer do seu jeito?', tipo: 'carinha', opcoes: ['Sim', 'Mais ou menos', 'Não'] },
          {
            id: 'c3_outra_turma',
            texto: 'Foi bom fazer junto com a outra turma?',
            tipo: 'carinha',
            opcoes: ['Sim', 'Mais ou menos', 'Não'],
          },
          { id: 'c4_arvore', texto: 'Você achou o seu trabalho na árvore?', tipo: 'carinha', opcoes: ['Sim', 'Não sei', 'Não'] },
          {
            id: 'c5_mais_atividades',
            texto: 'Você quer mais atividades assim?',
            tipo: 'carinha',
            opcoes: ['Sim', 'Talvez', 'Não'],
          },
          {
            id: 'c6_palavra',
            texto: 'Se quiser, diga uma palavra sobre o projeto:',
            tipo: 'texto',
            opcional: true,
          },
        ],
      },
    ],
    fim: 'Obrigado por participar! Todos pertencemos à escola.',
  },
};
