import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from xgboost import XGBClassifier
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
import warnings

warnings.filterwarnings('ignore')

class MotorPredicaoSEPA:
    """
    Motor Híbrido de Inteligência Artificial do SEPA.
    Combina previsão de Séries Temporais (Holt-Winters) com Classificação (XGBoost)
    para recomendar níveis de dificuldade e detectar estagnação em alunos com TEA.
    """
    
    def __init__(self):
        self.modelo_classificacao = XGBClassifier(
            n_estimators=100, 
            max_depth=4, 
            learning_rate=0.1, 
            use_label_encoder=False, 
            eval_metric='mlogloss',
            random_state=42
        )
        self.features_treinadas = []
        
    def _tratar_series_temporais(self, df):
        """
        Agrega dados irregularmente espaçados em semanas e trata semanas vazias.
        """
        df_ts = df.copy()
        df_ts.set_index('data_sessao', inplace=True)
        
        previsoes = []
        
        for (aluno, atividade), group in df_ts.groupby(['aluno_id', 'atividade_id']):
            serie_semanal = group.resample('W')['resultado'].mean().interpolate(method='linear')
            
            if len(serie_semanal) >= 3:
                modelo_hw = ExponentialSmoothing(serie_semanal, trend='add', seasonal=None, initialization_method="estimated")
                fit_hw = modelo_hw.fit()
                previsao = fit_hw.forecast(1).iloc[0]
            else:
                previsao = serie_semanal.mean()
                
            previsoes.append({
                'aluno_id': aluno,
                'atividade_id': atividade,
                'desempenho_projetado_hw': previsao
            })
            
        return pd.DataFrame(previsoes)

    def engenharia_de_features(self, df_historico):
        """
        Transforma dados brutos em conhecimento profundo sobre o padrão de aprendizagem.
        """
        df_features = df_historico.copy().sort_values(by=['aluno_id', 'atividade_id', 'data_sessao'])
        
        df_features['ewma_resultado'] = df_features.groupby(['aluno_id', 'atividade_id'])['resultado'].transform(lambda x: x.ewm(span=3, adjust=False).mean())
        df_features['volatilidade_aprendizado'] = df_features.groupby(['aluno_id', 'atividade_id'])['resultado'].transform(lambda x: x.rolling(window=3, min_periods=1).std().fillna(0))
        df_features['taxa_sucesso_efetiva'] = df_features['resultado'] / df_features['tentativas']
        df_features['tendencia_imediata'] = df_features.groupby(['aluno_id', 'atividade_id'])['resultado'].diff().fillna(0)
        
        df_hw = self._tratar_series_temporais(df_features)
        df_final = pd.merge(df_features, df_hw, on=['aluno_id', 'atividade_id'], how='left')
        
        return df_final

    def treinar_modelo(self, df_historico):
        """
        Pipeline completo de treinamento do modelo híbrido.
        """
        print("Iniciando processamento e engenharia de features...")
        df_completo = self.engenharia_de_features(df_historico)
        
        df_completo['nivel_recomendado'] = np.where(df_completo['resultado'] > 80, df_completo['nivel_dificuldade_atual'] + 1, df_completo['nivel_dificuldade_atual'])
        
        self.features_treinadas = ['ewma_resultado', 'volatilidade_aprendizado', 'taxa_sucesso_efetiva', 'tendencia_imediata', 'desempenho_projetado_hw']
        
        X = df_completo[self.features_treinadas]
        
        le = LabelEncoder()
        y = le.fit_transform(df_completo['nivel_recomendado'])
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("Treinando o motor XGBoost...")
        self.modelo_classificacao.fit(X_train, y_train)
        
        acuracia = accuracy_score(y_test, self.modelo_classificacao.predict(X_test))
        print(f"Treinamento concluído! Acurácia do Modelo: {acuracia * 100:.2f}%\n")
        
        return df_completo

    def gerar_explicabilidade_xai(self):
        """
        Imprime o nível de importância de cada variável para a decisão da IA.
        """
        importancias = self.modelo_classificacao.feature_importances_
        df_importancia = pd.DataFrame({'Feature': self.features_treinadas, 'Importância': importancias})
        df_importancia = df_importancia.sort_values(by='Importância', ascending=False)
        
        print(" EXPLICABILIDADE DA IA (XAI) ")
        print("Como o SEPA toma decisões para este aluno?")
        for index, row in df_importancia.iterrows():
            print(f"- {row['Feature']}: {row['Importância']:.2%}")
        print("\n")

    def gerar_dashboard_visual(self, df_processado, aluno_id, atividade_id):
        """
        Renderiza o gráfico dinâmico da evolução do aluno.
        """
        df_plot = df_processado[(df_processado['aluno_id'] == aluno_id) & (df_processado['atividade_id'] == atividade_id)].copy()
        
        plt.figure(figsize=(10, 6))
        
        # Plotando o resultado real
        plt.plot(df_plot['data_sessao'], df_plot['resultado'], marker='o', label='Resultado Bruto da Sessão', color='#2a6f97', linewidth=2)
        
        # Plotando a tendência suavizada (EWMA)
        plt.plot(df_plot['data_sessao'], df_plot['ewma_resultado'], linestyle='--', label='Tendência Consolidada (EWMA)', color='#f4a261', linewidth=2)
        
        # Plotando a projeção Holt-Winters
        plt.plot(df_plot['data_sessao'], df_plot['desempenho_projetado_hw'], linestyle=':', label='Projeção Holt-Winters', color='#e76f51', linewidth=2)
        
        plt.title(f'Painel de Desempenho e Predição SEPA\nAluno {aluno_id} | Atividade {atividade_id}', fontsize=14, fontweight='bold')
        plt.xlabel('Data da Sessão', fontsize=12)
        plt.ylabel('Desempenho (%)', fontsize=12)
        plt.ylim(0, 105)
        plt.grid(True, linestyle=':', alpha=0.7)
        plt.legend(loc='lower right')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Salva o gráfico na mesma pasta
        plt.savefig(f'dashboard_aluno_{aluno_id}_ativ_{atividade_id}.png')
        print(f"[!] Gráfico gerado e salvo com sucesso na sua pasta!")
        plt.show()
# Testando a nova arquitetura
if __name__ == "__main__":
    # Gerando dados fictícios para o teste
    np.random.seed(42)
    datas = pd.date_range(start='2025-01-01', periods=15, freq='4D')
    dados = {
        'aluno_id': [1]*15,
        'atividade_id': [10]*15,
        'data_sessao': datas,
        'resultado': np.random.randint(40, 95, 15),
        'tentativas': np.random.randint(1, 4, 15),
        'nivel_dificuldade_atual': [1]*5 + [2]*5 + [3]*5
    }
    df_teste = pd.DataFrame(dados)
    
    # Instancia a classe
    sepa_ai = MotorPredicaoSEPA()
    
    # Treina o modelo e processa as features
    df_processado = sepa_ai.treinar_modelo(df_teste)
    
    # Imprime a Explicabilidade (XAI) no terminal
    sepa_ai.gerar_explicabilidade_xai()
    
    # Gera o gráfico
    sepa_ai.gerar_dashboard_visual(df_processado, aluno_id=1, atividade_id=10)