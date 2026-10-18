from django.core.management.base import BaseCommand

from apps.ia.training import treinar_modelo


class Command(BaseCommand):
    help = "Treina o classificador XGBoost de recomendações com dados sintéticos anonimizados."

    def add_arguments(self, parser):
        parser.add_argument("--amostras", type=int, default=1800)
        parser.add_argument("--seed", type=int, default=42)

    def handle(self, *args, **options):
        treinar_modelo(n_amostras=options["amostras"], seed=options["seed"])
