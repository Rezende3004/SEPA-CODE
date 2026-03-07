CREATE TABLE Instituicao (
    ID_Instituicao INTEGER PRIMARY KEY,
    Nome_Fantasia VARCHAR(150),
    CNPJ VARCHAR(18),
    Endereco VARCHAR(255),
    Status_Assinatura VARCHAR(30)
);

CREATE TABLE Usuario (
    ID_Usuario INTEGER PRIMARY KEY,
    Nome VARCHAR(150),
    Email VARCHAR(255) UNIQUE,
    Senha VARCHAR(255),
    TipoUsuario VARCHAR(20),
    fk_ID_Instituicao INTEGER,
    FOREIGN KEY (fk_ID_Instituicao) REFERENCES Instituicao(ID_Instituicao)
);

CREATE TABLE Profissional (
    fk_ID_Usuario INTEGER PRIMARY KEY,
    Especialidade VARCHAR(100),
    Registro_Profissional VARCHAR(30),
    FOREIGN KEY (fk_ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE
);

CREATE TABLE Responsavel (
    fk_ID_Usuario INTEGER PRIMARY KEY,
    Telefone VARCHAR(20),
    FOREIGN KEY (fk_ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE
);

CREATE TABLE Aluno (
    fk_ID_Usuario INTEGER PRIMARY KEY,
    Data_Nascimento DATE,
    Observacoes VARCHAR(4000),
    fk_ID_Responsavel INTEGER,
    FOREIGN KEY (fk_ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (fk_ID_Responsavel) REFERENCES Responsavel(fk_ID_Usuario)
);

CREATE TABLE Atividade (
    ID_Atividade INTEGER PRIMARY KEY,
    Titulo VARCHAR(200),
    Descricao VARCHAR(4000),
    Nivel_Dificuldade SMALLINT,
    TipoAtividade VARCHAR(50),
    fk_ID_Instituicao INTEGER,
    FOREIGN KEY (fk_ID_Instituicao) REFERENCES Instituicao(ID_Instituicao)
);

CREATE TABLE ConteudoMultimidia (
    ID_Conteudo INTEGER PRIMARY KEY,
    NomeArquivo VARCHAR(255),
    TipoArquivo VARCHAR(50),
    URL VARCHAR(500),
    fk_ID_Instituicao INTEGER,
    FOREIGN KEY (fk_ID_Instituicao) REFERENCES Instituicao(ID_Instituicao)
);

CREATE TABLE PlanoDeAtendimento (
    ID_Plano INTEGER PRIMARY KEY,
    NomePlano VARCHAR(150),
    DataInicio DATE,
    Objetivos VARCHAR(4000),
    fk_ID_Profissional INTEGER,
    fk_ID_Aluno INTEGER,
    FOREIGN KEY (fk_ID_Profissional) REFERENCES Profissional(fk_ID_Usuario),
    FOREIGN KEY (fk_ID_Aluno) REFERENCES Aluno(fk_ID_Usuario)
);

CREATE TABLE Historico_Atividade (
    ID_Historico INTEGER PRIMARY KEY,
    DataHora TIMESTAMP,
    Resultado VARCHAR(100),
    Feedback VARCHAR(4000),
    fk_ID_Aluno INTEGER,
    fk_ID_Atividade INTEGER,
    FOREIGN KEY (fk_ID_Aluno) REFERENCES Aluno(fk_ID_Usuario),
    FOREIGN KEY (fk_ID_Atividade) REFERENCES Atividade(ID_Atividade)
);

CREATE TABLE Relatorio (
    ID_Relatorio INTEGER PRIMARY KEY,
    TituloRelatorio VARCHAR(200),
    DataGeracao TIMESTAMP,
    PeriodoInicio DATE,
    PeriodoFim DATE,
    ConteudoObservacoes VARCHAR(4000),
    fk_ID_Profissional INTEGER,
    fk_ID_Aluno INTEGER,
    FOREIGN KEY (fk_ID_Profissional) REFERENCES Profissional(fk_ID_Usuario),
    FOREIGN KEY (fk_ID_Aluno) REFERENCES Aluno(fk_ID_Usuario)
);

CREATE TABLE Analise_Aprendizado (
    ID_Analise INTEGER PRIMARY KEY,
    DataAnalise TIMESTAMP,
    PontuacaoCurva DECIMAL(10, 2),
    Tendencia VARCHAR(50),
    ObservacoesIA VARCHAR(4000),
    fk_ID_Aluno INTEGER,
    FOREIGN KEY (fk_ID_Aluno) REFERENCES Aluno(fk_ID_Usuario)
);

CREATE TABLE RecomendacaoIA (
    ID_Recomendacao INTEGER PRIMARY KEY,
    DataGeracao TIMESTAMP,
    DescricaoRecomendacao VARCHAR(4000),
    Status VARCHAR(30),
    fk_ID_Analise INTEGER,
    FOREIGN KEY (fk_ID_Analise) REFERENCES Analise_Aprendizado(ID_Analise)
);

CREATE TABLE Mensagem (
    ID_Mensagem INTEGER PRIMARY KEY,
    Conteudo_Texto VARCHAR(4000),
    DataEnvio TIMESTAMP,
    fk_ID_Usuario_Remetente INTEGER,
    FOREIGN KEY (fk_ID_Usuario_Remetente) REFERENCES Usuario(ID_Usuario)
);

/* Tabelas Associativas (N:N) */
CREATE TABLE Contem (
    fk_ID_PlanoDeAtendimento INTEGER,
    fk_ID_Atividade INTEGER,
    PRIMARY KEY (fk_ID_PlanoDeAtendimento, fk_ID_Atividade),
    FOREIGN KEY (fk_ID_PlanoDeAtendimento) REFERENCES PlanoDeAtendimento(ID_Plano),
    FOREIGN KEY (fk_ID_Atividade) REFERENCES Atividade(ID_Atividade)
);

CREATE TABLE Utiliza (
    fk_ID_Atividade INTEGER,
    fk_ID_Conteudo INTEGER,
    PRIMARY KEY (fk_ID_Atividade, fk_ID_Conteudo),
    FOREIGN KEY (fk_ID_Atividade) REFERENCES Atividade(ID_Atividade),
    FOREIGN KEY (fk_ID_Conteudo) REFERENCES ConteudoMultimidia(ID_Conteudo)
);

CREATE TABLE Sugere (
    fk_ID_RecomendacaoIA INTEGER,
    fk_ID_Atividade INTEGER,
    PRIMARY KEY (fk_ID_RecomendacaoIA, fk_ID_Atividade),
    FOREIGN KEY (fk_ID_RecomendacaoIA) REFERENCES RecomendacaoIA(ID_Recomendacao),
    FOREIGN KEY (fk_ID_Atividade) REFERENCES Atividade(ID_Atividade)
);