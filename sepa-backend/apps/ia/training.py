"""Treinamento do classificador XGBoost usado nas recomendações.

O modelo é treinado com dados sintéticos gerados a partir das features
numéricas (média, tentativas, tempo, ajuda e slope), sem qualquer
identificador de aluno, responsável ou profissional.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
from django.conf import settings
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from apps.ia.features import FEATURES

MODEL_CLASSES = [0, 1, 2]  # diminuir, manter, aumentar


def modelo_path() -> Path:
    return Path(settings.ML_MODEL_PATH)


def metadata_path() -> Path:
    return Path(settings.ML_METADATA_PATH)


def gerar_dados_sinteticos(n_amostras: int = 1800, seed: int = 42):
    rng = np.random.default_rng(seed)
    media_resultado = rng.uniform(30, 98, n_amostras)
    media_tentativas = rng.uniform(1, 4.5, n_amostras)
    tempo_medio = rng.uniform(15, 130, n_amostras)
    taxa_ajuda = rng.uniform(0, 0.8, n_amostras)
    slope = rng.uniform(-3.5, 3.5, n_amostras)

    # Regra pedagógica + ruído: desempenho alto e tendência positiva → aumentar;
    # desempenho baixo, muitas tentativas/ajuda ou tendência negativa → diminuir.
    score = (
        0.055 * media_resultado
        + 0.85 * slope
        - 0.55 * media_tentativas
        - 0.35 * taxa_ajuda * 10
        - 0.012 * tempo_medio
    )
    score += rng.normal(0, 0.35, n_amostras)
    labels = np.ones(n_amostras, dtype=int)
    labels[score >= 2.2] = 2
    labels[score <= 0.2] = 0

    features = np.column_stack([media_resultado, media_tentativas, tempo_medio, taxa_ajuda, slope])
    return features, labels


def treinar_modelo(n_amostras: int = 1800, seed: int = 42) -> dict:
    features, labels = gerar_dados_sinteticos(n_amostras=n_amostras, seed=seed)
    x_train, x_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=seed, stratify=labels
    )
    modelo = XGBClassifier(
        n_estimators=180,
        max_depth=3,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=seed,
        n_jobs=2,
    )
    modelo.fit(x_train, y_train)
    previsoes = modelo.predict(x_test)
    acuracia = float(accuracy_score(y_test, previsoes))
    matriz = confusion_matrix(y_test, previsoes, labels=MODEL_CLASSES).tolist()

    path = modelo_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(modelo, path)
    metadata = {
        "features": FEATURES,
        "classes": MODEL_CLASSES,
        "acuracia": round(acuracia, 4),
        "matriz_confusao": matriz,
        "amostras_treino": int(len(x_train)),
        "amostras_teste": int(len(x_test)),
        "treinado_em": datetime.now(UTC).isoformat(),
        "versao": "1.0.0",
    }
    metadata_path().write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print("=" * 64)  # noqa: T201
    print("SEPA · treinamento do modelo de recomendação")  # noqa: T201
    print(f"Features: {', '.join(FEATURES)}")  # noqa: T201
    print(f"Amostras: {len(features)} (treino={len(x_train)}, teste={len(x_test)})")  # noqa: T201
    print(f"Acurácia: {acuracia:.4f}")  # noqa: T201
    print(f"Matriz de confusão (diminuir/manter/aumentar): {matriz}")  # noqa: T201
    print(f"Modelo salvo em: {path}")  # noqa: T201
    print("=" * 64)  # noqa: T201
    return metadata


def carregar_modelo() -> XGBClassifier | None:
    path = modelo_path()
    if not path.exists():
        return None
    try:
        return joblib.load(path)
    except Exception:  # noqa: BLE001
        return None


def carregar_metadata() -> dict:
    path = metadata_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
