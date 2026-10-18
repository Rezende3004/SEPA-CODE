import { classificarTendencia, media, slope } from '@/shared/lib/stats';
import type {
  Aluno,
  AnaliseAprendizado,
  Atividade,
  ConteudoMultimidia,
  FatorRecomendacao,
  HistoricoAtividade,
  Instituicao,
  ItemAtividade,
  Mensagem,
  PlanoDeAtendimento,
  Profissional,
  RecomendacaoIA,
  Responsavel,
  StatusRecomendacao,
  TipoUsuario,
  Usuario,
} from '@/shared/types';
import type { Banco } from './db';
import { criarRandom, inteiroEntre, limitar } from './lib/random';

const SENHA_SEED = 'Sepa@2026';

function dataHora(diasAtras: number, hora = 9, minuto = 0): string {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  data.setHours(hora, minuto, 0, 0);
  return data.toISOString();
}

function dataNascimento(idade: number, mes: number, dia: number): string {
  const ano = new Date().getFullYear() - idade;
  return new Date(ano, mes - 1, dia, 12, 0, 0).toISOString();
}

function usuario<T extends TipoUsuario>(
  id: number,
  nome: string,
  email: string,
  tipoUsuario: T,
  instituicaoId: number | null,
  ativo = true,
): Usuario & { tipoUsuario: T } {
  return { id, nome, email, tipoUsuario, instituicaoId, ativo };
}

interface DefinicaoAtividade {
  titulo: string;
  descricao: string;
  nivelDificuldade: number;
  tipoAtividade: Atividade['tipoAtividade'];
  instituicaoId: number;
  itens: [valor: string, rotulo: string, dica: string][];
}

const definicoesAtividades: DefinicaoAtividade[] = [
  {
    titulo: 'Quem é este animal?',
    descricao: 'Associe cada animal à palavra correta.',
    nivelDificuldade: 1,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['🐶', 'Cachorro', 'Ele late e abana o rabo.'],
      ['🐱', 'Gato', 'Ele mia e gosta de dormir no sofá.'],
      ['🐰', 'Coelho', 'Ele pula e gosta de cenoura.'],
      ['🐦', 'Pássaro', 'Ele canta e tem asas.'],
    ],
  },
  {
    titulo: 'Frutas coloridas',
    descricao: 'Encontre o nome de cada fruta.',
    nivelDificuldade: 1,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['🍎', 'Maçã', 'É vermelha e faz barulho ao morder.'],
      ['🍌', 'Banana', 'É amarela e o macaco adora.'],
      ['🍇', 'Uva', 'Vem em cachos e pode ser roxa.'],
      ['🍊', 'Laranja', 'É redonda e cheia de suco.'],
    ],
  },
  {
    titulo: 'Meios de transporte',
    descricao: 'Descubra como as pessoas se locomovem.',
    nivelDificuldade: 2,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['🚗', 'Carro', 'Tem quatro rodas e um volante.'],
      ['🚌', 'Ônibus', 'Leva muitas pessoas juntas.'],
      ['🚲', 'Bicicleta', 'Tem duas rodas e pedais.'],
      ['✈️', 'Avião', 'Voa bem alto entre as nuvens.'],
    ],
  },
  {
    titulo: 'Formas e cores',
    descricao: 'Relacione as formas com seus nomes.',
    nivelDificuldade: 2,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['🔺', 'Triângulo', 'Tem três lados.'],
      ['🟦', 'Quadrado', 'Tem quatro lados iguais.'],
      ['🔵', 'Círculo', 'É redondo, sem cantos.'],
      ['⭐', 'Estrela', 'Tem pontas e brilha no céu.'],
    ],
  },
  {
    titulo: 'Objetos da escola',
    descricao: 'O que usamos para estudar?',
    nivelDificuldade: 3,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['✏️', 'Lápis', 'Serve para escrever e apagar.'],
      ['📚', 'Livro', 'Tem páginas e histórias.'],
      ['🎒', 'Mochila', 'Carrega os materiais nas costas.'],
      ['🖍️', 'Giz de cera', 'Colore os desenhos.'],
    ],
  },
  {
    titulo: 'Sentimentos',
    descricao: 'Reconheça como as pessoas se sentem.',
    nivelDificuldade: 3,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['😊', 'Feliz', 'A boca sorri e os olhos brilham.'],
      ['😢', 'Triste', 'Às vezes saem lágrimas.'],
      ['😠', 'Bravo', 'As sobrancelhas ficam juntas.'],
      ['😴', 'Cansado', 'Os olhos fecham e vem o bocejo.'],
    ],
  },
  {
    titulo: 'Profissões',
    descricao: 'Quem faz cada trabalho?',
    nivelDificuldade: 4,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['👩‍⚕️', 'Médica', 'Cuida da saúde das pessoas.'],
      ['👨‍🍳', 'Cozinheiro', 'Prepara comidas gostosas.'],
      ['👮', 'Policial', 'Protege as pessoas na cidade.'],
      ['👩‍🏫', 'Professora', 'Ensina na escola.'],
    ],
  },
  {
    titulo: 'Animais do oceano',
    descricao: 'Conheça os animais que vivem no mar.',
    nivelDificuldade: 5,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 1,
    itens: [
      ['🐬', 'Golfinho', 'É inteligente e salta nas ondas.'],
      ['🐙', 'Polvo', 'Tem oito braços.'],
      ['🐢', 'Tartaruga', 'Carrega o casco nas costas.'],
      ['🦈', 'Tubarão', 'Tem dentes pontudos e nada rápido.'],
    ],
  },
  {
    titulo: 'Rotina da manhã',
    descricao: 'Coloque os passos da manhã na ordem certa.',
    nivelDificuldade: 1,
    tipoAtividade: 'SEQUENCIA',
    instituicaoId: 1,
    itens: [
      ['🌅', 'Acordar', 'Primeiro passo do dia.'],
      ['🚿', 'Tomar banho', 'Depois de acordar, ficamos limpos.'],
      ['🪥', 'Escovar os dentes', 'Depois do banho.'],
      ['🍳', 'Tomar café', 'Por último, a comida.'],
    ],
  },
  {
    titulo: 'Hora de dormir',
    descricao: 'Organize a rotina antes de dormir.',
    nivelDificuldade: 2,
    tipoAtividade: 'SEQUENCIA',
    instituicaoId: 1,
    itens: [
      ['🧸', 'Guardar brinquedos', 'Antes de descansar, organizamos.'],
      ['🛁', 'Tomar banho', 'Depois de guardar os brinquedos.'],
      ['🪥', 'Escovar os dentes', 'Antes de ir para a cama.'],
      ['🛏️', 'Deitar', 'O último passo.'],
    ],
  },
  {
    titulo: 'Cores primárias',
    descricao: 'Associe cada cor ao seu nome.',
    nivelDificuldade: 1,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 2,
    itens: [
      ['🔴', 'Vermelho', 'É a cor do morango.'],
      ['🔵', 'Azul', 'É a cor do céu.'],
      ['🟡', 'Amarelo', 'É a cor do sol.'],
      ['🟢', 'Verde', 'É a cor da grama.'],
    ],
  },
  {
    titulo: 'Animais da fazenda',
    descricao: 'Quem vive na fazenda?',
    nivelDificuldade: 2,
    tipoAtividade: 'ASSOCIACAO',
    instituicaoId: 2,
    itens: [
      ['🐄', 'Vaca', 'Dá leite e faz muuu.'],
      ['🐖', 'Porco', 'Gosta de lama e faz oinc.'],
      ['🐔', 'Galinha', 'Bota ovos e faz có-có.'],
      ['🐴', 'Cavalo', 'Galopa e faz relincho.'],
    ],
  },
  {
    titulo: 'Preparar um sanduíche',
    descricao: 'Monte o lanche na ordem correta.',
    nivelDificuldade: 2,
    tipoAtividade: 'SEQUENCIA',
    instituicaoId: 2,
    itens: [
      ['🍞', 'Pegar o pão', 'Primeiro pegamos o pão.'],
      ['🧈', 'Passar manteiga', 'Depois espalhamos a manteiga.'],
      ['🧀', 'Colocar queijo', 'Em seguida o queijo.'],
      ['🥪', 'Fechar o sanduíche', 'Por último, fechamos.'],
    ],
  },
  {
    titulo: 'Plantar uma semente',
    descricao: 'Qual é a ordem para a planta crescer?',
    nivelDificuldade: 3,
    tipoAtividade: 'SEQUENCIA',
    instituicaoId: 2,
    itens: [
      ['🕳️', 'Abrir a cova', 'Primeiro preparamos a terra.'],
      ['🌱', 'Colocar a semente', 'Depois colocamos a semente.'],
      ['💧', 'Regar', 'A planta precisa de água.'],
      ['☀️', 'Esperar o sol', 'Por fim, o sol ajuda a crescer.'],
    ],
  },
  {
    titulo: 'Escovar os dentes',
    descricao: 'Organize os passos da escovação.',
    nivelDificuldade: 1,
    tipoAtividade: 'SEQUENCIA',
    instituicaoId: 2,
    itens: [
      ['🪥', 'Pegar a escova', 'Primeiro pegamos a escova.'],
      ['🦷', 'Colocar a pasta', 'Depois vem a pasta.'],
      ['🌀', 'Escovar', 'Fazemos movimentos circulares.'],
      ['🥤', 'Enxaguar', 'No final, enxaguamos.'],
    ],
  },
];

function criarAtividades(): { atividades: Atividade[]; conteudos: ConteudoMultimidia[] } {
  const conteudos: ConteudoMultimidia[] = [];
  const atividades = definicoesAtividades.map((definicao, indice) => {
    const id = indice + 1;
    const itemBase = id * 100;
    const itens: ItemAtividade[] = definicao.itens.map(([valor, rotulo, dica], itemIndice) => ({
      id: itemBase + itemIndice,
      tipo: 'EMOJI',
      valor,
      rotulo,
      dica,
    }));
    conteudos.push({
      id,
      nomeArquivo: `atividade-${id}.svg`,
      tipoArquivo: 'image/svg+xml',
      url: `/mocks/conteudos/atividade-${id}.svg`,
      instituicaoId: definicao.instituicaoId,
    });
    return {
      id,
      titulo: definicao.titulo,
      descricao: definicao.descricao,
      nivelDificuldade: definicao.nivelDificuldade,
      tipoAtividade: definicao.tipoAtividade,
      instituicaoId: definicao.instituicaoId,
      conteudoIds: [id],
      itens,
    };
  });
  return { atividades, conteudos };
}

interface PerfilDesempenho {
  base: number;
  crescimento: number;
  jitter: number;
  tentativas: [number, number];
  probabilidadeAjuda: number;
  tempo: [number, number];
}

const perfisDesempenho: Record<number, PerfilDesempenho> = {
  11: {
    base: 64,
    crescimento: 2.1,
    jitter: 6,
    tentativas: [1, 2],
    probabilidadeAjuda: 0.2,
    tempo: [30, 70],
  },
  12: {
    base: 49,
    crescimento: 0.2,
    jitter: 4,
    tentativas: [3, 4],
    probabilidadeAjuda: 0.55,
    tempo: [65, 120],
  },
  13: {
    base: 56,
    crescimento: 3,
    jitter: 7,
    tentativas: [2, 3],
    probabilidadeAjuda: 0.25,
    tempo: [35, 80],
  },
  14: {
    base: 65,
    crescimento: 0.1,
    jitter: 12,
    tentativas: [2, 3],
    probabilidadeAjuda: 0.3,
    tempo: [45, 95],
  },
  15: {
    base: 67,
    crescimento: 1.5,
    jitter: 6,
    tentativas: [1, 2],
    probabilidadeAjuda: 0.18,
    tempo: [30, 65],
  },
  16: {
    base: 72,
    crescimento: 1.7,
    jitter: 6,
    tentativas: [1, 2],
    probabilidadeAjuda: 0.12,
    tempo: [25, 60],
  },
};

const feedbacksPositivos = [
  'Muito bem! Você concluiu com atenção.',
  'Excelente! Cada tentativa mostrou seu esforço.',
  'Ótimo trabalho! Continue praticando.',
];
const feedbacksIntermediarios = [
  'Bom trabalho! Você está aprendendo.',
  'Você conseguiu! Vamos praticar mais um pouco.',
];
const feedbacksApoio = [
  'Você tentou e isso é importante. Vamos praticar juntos.',
  'Cada passo conta. Vamos tentar mais uma vez com calma.',
];

function criarHistorico(
  planos: PlanoDeAtendimento[],
  atividades: Atividade[],
): HistoricoAtividade[] {
  const random = criarRandom(2026);
  const historico: HistoricoAtividade[] = [];
  let id = 1;

  for (const plano of planos) {
    const perfil = perfisDesempenho[plano.alunoId];
    for (const atividadeId of plano.atividadeIds) {
      const atividade = atividades.find((item) => item.id === atividadeId);
      if (!atividade) continue;
      let indiceSessao = 0;
      for (let semana = 0; semana < 8; semana += 1) {
        for (let sessao = 0; sessao < 2; sessao += 1) {
          const dias = (7 - semana) * 7 + (1 - sessao) * 3;
          const variacao = (random() - 0.5) * 2 * perfil.jitter;
          const ajusteNivel = (3 - atividade.nivelDificuldade) * 2.5;
          const resultadoBruto =
            perfil.base + perfil.crescimento * indiceSessao + variacao + ajusteNivel;
          const resultado = Math.round(limitar(resultadoBruto, 30, 98));
          const tentativas = inteiroEntre(random, perfil.tentativas[0], perfil.tentativas[1]);
          const probabilidadeAjuda = Math.max(
            0.05,
            perfil.probabilidadeAjuda - indiceSessao * 0.015,
          );
          const pediuAjuda = random() < probabilidadeAjuda;
          const feedback =
            resultado >= 80
              ? feedbacksPositivos[Math.floor(random() * feedbacksPositivos.length)]
              : resultado >= 60
                ? feedbacksIntermediarios[Math.floor(random() * feedbacksIntermediarios.length)]
                : feedbacksApoio[Math.floor(random() * feedbacksApoio.length)];
          historico.push({
            id: id++,
            dataHora: dataHora(dias, 9 + sessao * 2, inteiroEntre(random, 0, 55)),
            resultado,
            tentativas,
            tempoRespostaSeg: inteiroEntre(random, perfil.tempo[0], perfil.tempo[1]),
            feedback,
            alunoId: plano.alunoId,
            atividadeId,
            pediuAjuda,
          });
          indiceSessao += 1;
        }
      }
    }
  }

  return historico.sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

function criarAnalises(historicos: HistoricoAtividade[], alunos: Aluno[]): AnaliseAprendizado[] {
  return alunos.map((aluno, indice) => {
    const resultados = historicos
      .filter((registro) => registro.alunoId === aluno.id)
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
      .map((registro) => registro.resultado);
    const mediaResultados = media(resultados);
    const coeficiente = slope(resultados);
    const tendencia = classificarTendencia(coeficiente);
    const descricaoTendencia =
      tendencia === 'EVOLUCAO'
        ? 'os resultados mostram ganho consistente ao longo das sessões'
        : tendencia === 'REGRESSAO'
          ? 'os resultados caíram nas últimas sessões'
          : 'os resultados se mantêm estáveis, sem ganho consistente';
    return {
      id: indice + 1,
      dataAnalise: dataHora(1, 8),
      pontuacaoCurva: Number(mediaResultados.toFixed(2)),
      tendencia,
      observacoesIA: `A análise das últimas oito semanas indica que ${descricaoTendencia}. Média de ${mediaResultados.toFixed(0)}% e tendência de ${coeficiente.toFixed(1)} ponto(s) por sessão.`,
      alunoId: aluno.id,
    };
  });
}

interface DefinicaoRecomendacao {
  alunoId: number;
  atividadeIds: number[];
  nivelAtual: number;
  nivelSugerido: number;
  status: StatusRecomendacao;
  descricao: string;
  fatores: FatorRecomendacao[];
  diasAtras: number;
}

const definicoesRecomendacoes: DefinicaoRecomendacao[] = [
  {
    alunoId: 12,
    atividadeIds: [6, 9],
    nivelAtual: 3,
    nivelSugerido: 2,
    status: 'PENDENTE',
    descricao:
      'Helena mantém resultados estáveis há várias semanas e pede ajuda com frequência. Sugerimos reduzir temporariamente o nível de duas atividades para consolidar a base antes de avançar.',
    diasAtras: 1,
    fatores: [
      { metrica: 'Média de resultados', valor: 49, peso: 0.34 },
      { metrica: 'Tendência (slope)', valor: 0.2, peso: 0.24 },
      { metrica: 'Pedidos de ajuda', valor: 55, peso: 0.2 },
      { metrica: 'Taxa de sucesso', valor: 44, peso: 0.12 },
      { metrica: 'Projeção da curva', valor: 50, peso: 0.1 },
    ],
  },
  {
    alunoId: 11,
    atividadeIds: [3, 6],
    nivelAtual: 3,
    nivelSugerido: 4,
    status: 'PENDENTE',
    descricao:
      'Lucas apresenta ganho consistente e poucos pedidos de ajuda. A projeção indica que ele está pronto para atividades de nível 4.',
    diasAtras: 1,
    fatores: [
      { metrica: 'Média de resultados', valor: 79, peso: 0.3 },
      { metrica: 'Tendência (slope)', valor: 2.1, peso: 0.28 },
      { metrica: 'Taxa de sucesso', valor: 82, peso: 0.18 },
      { metrica: 'Pedidos de ajuda', valor: 18, peso: 0.14 },
      { metrica: 'Projeção da curva', valor: 86, peso: 0.1 },
    ],
  },
  {
    alunoId: 13,
    atividadeIds: [4, 7],
    nivelAtual: 4,
    nivelSugerido: 5,
    status: 'PENDENTE',
    descricao:
      'Theo evoluiu rápido nas últimas semanas. A sugestão é introduzir um desafio de nível 5 mantendo o acompanhamento próximo.',
    diasAtras: 2,
    fatores: [
      { metrica: 'Média de resultados', valor: 84, peso: 0.32 },
      { metrica: 'Tendência (slope)', valor: 3, peso: 0.3 },
      { metrica: 'Taxa de sucesso', valor: 88, peso: 0.16 },
      { metrica: 'Volatilidade', valor: 7, peso: 0.12 },
      { metrica: 'Projeção da curva', valor: 90, peso: 0.1 },
    ],
  },
  {
    alunoId: 16,
    atividadeIds: [11, 12],
    nivelAtual: 2,
    nivelSugerido: 3,
    status: 'PENDENTE',
    descricao:
      'Alice acerta a maioria das atividades com poucas tentativas. Sugerimos subir para o nível 3 e observar a resposta nas próximas sessões.',
    diasAtras: 3,
    fatores: [
      { metrica: 'Média de resultados', valor: 87, peso: 0.3 },
      { metrica: 'Tendência (slope)', valor: 1.7, peso: 0.27 },
      { metrica: 'Taxa de sucesso', valor: 90, peso: 0.18 },
      { metrica: 'Tentativas por sessão', valor: 1.4, peso: 0.15 },
      { metrica: 'Projeção da curva', valor: 89, peso: 0.1 },
    ],
  },
  {
    alunoId: 14,
    atividadeIds: [5, 8],
    nivelAtual: 5,
    nivelSugerido: 4,
    status: 'REJEITADA',
    descricao:
      'A oscilação nos resultados sugeria reduzir o nível, mas a decisão foi manter o desafio atual.',
    diasAtras: 9,
    fatores: [
      { metrica: 'Média de resultados', valor: 66, peso: 0.3 },
      { metrica: 'Volatilidade', valor: 12, peso: 0.3 },
      { metrica: 'Tendência (slope)', valor: 0.1, peso: 0.2 },
      { metrica: 'Pedidos de ajuda', valor: 30, peso: 0.1 },
      { metrica: 'Projeção da curva', valor: 65, peso: 0.1 },
    ],
  },
  {
    alunoId: 15,
    atividadeIds: [11, 13],
    nivelAtual: 2,
    nivelSugerido: 3,
    status: 'ACEITA',
    descricao:
      'Miguel demonstrou segurança nas atividades atuais. O nível 3 foi aplicado após avaliação do profissional.',
    diasAtras: 11,
    fatores: [
      { metrica: 'Média de resultados', valor: 78, peso: 0.32 },
      { metrica: 'Tendência (slope)', valor: 1.5, peso: 0.26 },
      { metrica: 'Taxa de sucesso', valor: 80, peso: 0.18 },
      { metrica: 'Pedidos de ajuda', valor: 18, peso: 0.14 },
      { metrica: 'Projeção da curva', valor: 81, peso: 0.1 },
    ],
  },
];

function criarRecomendacoes(analises: AnaliseAprendizado[]): RecomendacaoIA[] {
  return definicoesRecomendacoes.map((definicao, indice) => {
    const analise = analises.find((item) => item.alunoId === definicao.alunoId);
    return {
      id: indice + 1,
      dataGeracao: dataHora(definicao.diasAtras, 8, 30),
      descricaoRecomendacao: definicao.descricao,
      status: definicao.status,
      analiseId: analise?.id ?? 1,
      atividadeIds: definicao.atividadeIds,
      nivelSugerido: definicao.nivelSugerido,
      nivelAtual: definicao.nivelAtual,
      fatores: definicao.fatores,
      alunoId: definicao.alunoId,
    };
  });
}

function criarMensagens(): Mensagem[] {
  const definicoes: [
    remetente: number,
    destinatario: number,
    texto: string,
    dias: number,
    lida: boolean,
  ][] = [
    [6, 2, 'Olá, Ana! O Lucas comentou que gostou muito da atividade dos animais.', 4, true],
    [2, 6, 'Que ótima notícia, Mariana! Ele foi muito bem na associação de palavras.', 4, true],
    [
      2,
      6,
      'Esta semana vamos trabalhar a rotina da manhã. Se puder, retome os passos em casa.',
      2,
      true,
    ],
    [6, 2, 'Combinado! Vamos praticar depois do café da manhã.', 2, true],
    [
      6,
      2,
      'Ana, o Lucas pediu para fazer a atividade do oceano de novo. Dá para incluir?',
      1,
      false,
    ],
    [
      6,
      3,
      'Bruno, a Helena tem ficado cansada nas sessões da tarde. Podemos ajustar o horário?',
      3,
      true,
    ],
    [3, 6, 'Claro! Vou conversar com a equipe e te retorno ainda esta semana.', 2, true],
    [8, 5, 'Diego, o Miguel está animado com as atividades de sequência.', 2, true],
    [5, 8, 'Fico feliz! Ele está pronto para um nível um pouco maior.', 1, false],
    [9, 3, 'Boa tarde, Bruno! A Sofia quer continuar praticando em casa.', 1, false],
  ];

  return definicoes
    .map(([remetenteId, destinatarioId, conteudoTexto, dias, lida], indice) => ({
      id: indice + 1,
      conteudoTexto,
      dataEnvio: dataHora(dias, 10 + indice, indice * 3),
      remetenteId,
      destinatarioId,
      lida,
    }))
    .sort((a, b) => a.dataEnvio.localeCompare(b.dataEnvio));
}

export function criarBanco(): Banco {
  const instituicoes: Instituicao[] = [
    {
      id: 1,
      nomeFantasia: 'Instituto Horizonte Azul',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Acácias, 120 — Belo Horizonte/MG',
      statusAssinatura: 'ATIVA',
    },
    {
      id: 2,
      nomeFantasia: 'Clínica Sentir',
      cnpj: '98.765.432/0001-10',
      endereco: 'Av. do Contorno, 450 — Contagem/MG',
      statusAssinatura: 'ATIVA',
    },
  ];

  const admin = usuario(1, 'Administração SEPA', 'admin@sepa.exemplo', 'ADMINISTRADOR', null);

  const profissionais: Profissional[] = [
    {
      ...usuario(2, 'Ana Ribeiro', 'ana.psicologa@sepa.exemplo', 'PROFISSIONAL', 1),
      especialidade: 'PSICOLOGO',
      registroProfissional: 'CRP 06/12345',
    },
    {
      ...usuario(3, 'Bruno Almeida', 'bruno.fono@sepa.exemplo', 'PROFISSIONAL', 1),
      especialidade: 'FONOAUDIOLOGO',
      registroProfissional: 'CRFa 2-9876',
    },
    {
      ...usuario(4, 'Carla Nunes', 'carla.pedagoga@sepa.exemplo', 'PROFISSIONAL', 1),
      especialidade: 'PEDAGOGO',
      registroProfissional: 'MEC 445566',
    },
    {
      ...usuario(5, 'Diego Martins', 'diego.psicologo@sepa.exemplo', 'PROFISSIONAL', 2),
      especialidade: 'PSICOLOGO',
      registroProfissional: 'CRP 04/55667',
    },
  ];

  const responsaveis: Responsavel[] = [
    {
      ...usuario(6, 'Mariana Costa', 'mariana.responsavel@sepa.exemplo', 'RESPONSAVEL', 1),
      telefone: '(31) 99999-0101',
    },
    {
      ...usuario(7, 'Renata Lima', 'renata.responsavel@sepa.exemplo', 'RESPONSAVEL', 1),
      telefone: '(31) 99999-0202',
    },
    {
      ...usuario(8, 'Paulo Santos', 'paulo.responsavel@sepa.exemplo', 'RESPONSAVEL', 2),
      telefone: '(31) 99999-0303',
    },
    {
      ...usuario(9, 'Fernanda Rocha', 'fernanda.responsavel@sepa.exemplo', 'RESPONSAVEL', 1),
      telefone: '(31) 99999-0404',
    },
    {
      ...usuario(10, 'Juliana Alves', 'juliana.responsavel@sepa.exemplo', 'RESPONSAVEL', 2),
      telefone: '(31) 99999-0505',
    },
  ];

  const alunos: Aluno[] = [
    {
      ...usuario(11, 'Lucas Costa', 'lucas.aluno@sepa.exemplo', 'ALUNO', 1),
      dataNascimento: dataNascimento(9, 3, 12),
      observacoes: 'Gosta de animais e de atividades com sequências. Sensível a sons altos.',
      responsavelId: 6,
    },
    {
      ...usuario(12, 'Helena Costa', 'helena.aluno@sepa.exemplo', 'ALUNO', 1),
      dataNascimento: dataNascimento(10, 11, 2),
      observacoes: 'Prefere instruções curtas e precisa de pausas entre as atividades.',
      responsavelId: 6,
    },
    {
      ...usuario(13, 'Theo Oliveira', 'theo.aluno@sepa.exemplo', 'ALUNO', 1),
      dataNascimento: dataNascimento(8, 5, 21),
      observacoes: 'Muito motivado por desafios novos. Beneficia-se de elogios específicos.',
      responsavelId: 7,
    },
    {
      ...usuario(14, 'Sofia Rocha', 'sofia.aluno@sepa.exemplo', 'ALUNO', 1),
      dataNascimento: dataNascimento(9, 8, 30),
      observacoes: 'Alterna dias de muita energia e dias de maior cansaço.',
      responsavelId: 9,
    },
    {
      ...usuario(15, 'Miguel Santos', 'miguel.aluno@sepa.exemplo', 'ALUNO', 2),
      dataNascimento: dataNascimento(10, 2, 14),
      observacoes: 'Gosta de rotinas previsíveis e de repetir as instruções.',
      responsavelId: 8,
    },
    {
      ...usuario(16, 'Alice Alves', 'alice.aluno@sepa.exemplo', 'ALUNO', 2),
      dataNascimento: dataNascimento(8, 9, 9),
      observacoes: 'Aprende melhor com apoio visual e pistas curtas.',
      responsavelId: 10,
    },
  ];

  const { atividades, conteudos } = criarAtividades();

  const planos: PlanoDeAtendimento[] = [
    {
      id: 1,
      nomePlano: 'Plano de comunicação e rotina — Lucas',
      dataInicio: dataHora(60).slice(0, 10),
      objetivos:
        'Ampliar vocabulário funcional, reconhecer sentimentos e organizar a rotina da manhã com autonomia.',
      profissionalId: 2,
      alunoId: 11,
      atividadeIds: [1, 3, 6, 9, 10],
    },
    {
      id: 2,
      nomePlano: 'Consolidação de base — Helena',
      dataInicio: dataHora(58).slice(0, 10),
      objetivos:
        'Reforçar associação palavra-imagem, reduzir a necessidade de ajuda e consolidar sequências simples.',
      profissionalId: 2,
      alunoId: 12,
      atividadeIds: [1, 2, 6, 9],
    },
    {
      id: 3,
      nomePlano: 'Desafios de aprendizagem — Theo',
      dataInicio: dataHora(55).slice(0, 10),
      objetivos: 'Estimular generalização, ampliar repertório e avançar gradualmente de nível.',
      profissionalId: 4,
      alunoId: 13,
      atividadeIds: [2, 4, 7, 10],
    },
    {
      id: 4,
      nomePlano: 'Regulação e participação — Sofia',
      dataInicio: dataHora(50).slice(0, 10),
      objetivos:
        'Fortalecer participação nas atividades, respeitando os dias de maior sensibilidade.',
      profissionalId: 3,
      alunoId: 14,
      atividadeIds: [3, 5, 8, 9],
    },
    {
      id: 5,
      nomePlano: 'Rotina e vocabulário — Miguel',
      dataInicio: dataHora(45).slice(0, 10),
      objetivos: 'Trabalhar rotinas do dia a dia e vocabulário do cotidiano com apoio visual.',
      profissionalId: 5,
      alunoId: 15,
      atividadeIds: [11, 12, 13],
    },
    {
      id: 6,
      nomePlano: 'Autonomia e sequências — Alice',
      dataInicio: dataHora(42).slice(0, 10),
      objetivos: 'Desenvolver autonomia em sequências e ampliar o repertório de palavras.',
      profissionalId: 5,
      alunoId: 16,
      atividadeIds: [11, 12, 14, 15],
    },
  ];

  const historico = criarHistorico(planos, atividades);
  const analises = criarAnalises(historico, alunos);
  const recomendacoes = criarRecomendacoes(analises);

  const usuarios: Usuario[] = [admin, ...profissionais, ...responsaveis, ...alunos];

  const credenciais: Record<string, string> = {};
  usuarios.forEach((item) => {
    credenciais[item.email] = SENHA_SEED;
  });
  // Contas de aluno não são criadas no cadastro público, mas existem no seed para o RF-008.
  credenciais['lucas.aluno@sepa.exemplo'] = SENHA_SEED;
  credenciais['helena.aluno@sepa.exemplo'] = SENHA_SEED;

  return {
    instituicoes,
    usuarios,
    profissionais,
    responsaveis,
    alunos,
    atividades,
    conteudos,
    planos,
    historico,
    relatorios: [],
    analises,
    recomendacoes,
    mensagens: criarMensagens(),
    credenciais,
  };
}

export const SENHA_DEMONSTRACAO = SENHA_SEED;
