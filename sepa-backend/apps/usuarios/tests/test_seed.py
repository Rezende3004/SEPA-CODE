from __future__ import annotations

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError


@pytest.mark.django_db
def test_seed_demo_aborta_quando_debug_false(settings):
    settings.DEBUG = False
    with pytest.raises(CommandError, match="DEBUG=True"):
        call_command("seed_demo", force=True)
