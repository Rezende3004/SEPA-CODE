from django.db import migrations, models


def preencher_nivel_atribuido(apps, schema_editor):
    Contem = apps.get_model("planos", "Contem")
    for contem in Contem.objects.select_related("atividade").iterator():
        contem.nivel_atribuido = contem.atividade.nivel_dificuldade
        contem.save(update_fields=["nivel_atribuido"])


def reverter_nivel_atribuido(apps, schema_editor):
    # O campo é removido pela operação inversa; não há dados a restaurar.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("planos", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="contem",
            name="nivel_atribuido",
            field=models.PositiveSmallIntegerField(
                null=True,
                verbose_name="nível atribuído",
            ),
        ),
        migrations.RunPython(preencher_nivel_atribuido, reverter_nivel_atribuido),
        migrations.AlterField(
            model_name="contem",
            name="nivel_atribuido",
            field=models.PositiveSmallIntegerField(verbose_name="nível atribuído"),
        ),
        migrations.AddConstraint(
            model_name="contem",
            constraint=models.CheckConstraint(
                condition=models.Q(nivel_atribuido__gte=1)
                & models.Q(nivel_atribuido__lte=5),
                name="contem_nivel_atribuido_1_a_5",
            ),
        ),
    ]
