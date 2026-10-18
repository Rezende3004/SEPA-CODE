from django.core.management.base import BaseCommand
from django.db import transaction

from apps.ia.services import analisar_aluno
from apps.planos.models import PlanoDeAtendimento
from apps.usuarios.models import Aluno


class Command(BaseCommand):
    help = "Gera análises e recomendações pendentes para os alunos com histórico."

    def add_arguments(self, parser):
        parser.add_argument("--aluno", type=int, help="Gera apenas para o aluno informado.")

    @transaction.atomic
    def handle(self, *args, **options):
        alunos = Aluno.objects.select_related("usuario").order_by("id")
        if options.get("aluno"):
            alunos = alunos.filter(pk=options["aluno"])

        geradas = 0
        ignorados = 0
        for aluno in alunos:
            plano = (
                PlanoDeAtendimento.objects.filter(aluno=aluno)
                .select_related("profissional__usuario")
                .order_by("data_inicio")
                .first()
            )
            if plano is None:
                ignorados += 1
                self.stdout.write(f"Aluno {aluno.pk} sem plano: ignorado.")
                continue
            try:
                _, recomendacao = analisar_aluno(aluno, plano.profissional.usuario, request=None)
            except Exception as exc:  # noqa: BLE001
                ignorados += 1
                self.stdout.write(f"Aluno {aluno.pk}: {exc}")
                continue
            geradas += 1
            self.stdout.write(
                f"Aluno {aluno.pk}: recomendação {recomendacao.pk} "
                f"({recomendacao.nivel_atual} → {recomendacao.nivel_sugerido})"
            )

        self.stdout.write(
            self.style.SUCCESS(f"Recomendações geradas: {geradas}; ignoradas: {ignorados}.")
        )
