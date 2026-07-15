from types import SimpleNamespace

from utils.admin_permissions import get_effective_admin_permissions


def test_superadmin_uses_own_saved_permissions():
    superadmin = SimpleNamespace(
        role="superadmin",
        admin_permissions={"bioimpedance": False, "sport_advice": False},
    )

    permissions = get_effective_admin_permissions(superadmin)

    assert permissions["bioimpedance"] is False
    assert permissions["sport_advice"] is False
    assert permissions["shoulder_length"] is True


def test_field_assistant_inherits_supervisor_permissions():
    supervisor = SimpleNamespace(
        role="admin",
        admin_permissions={"activity_advice": False},
    )
    assistant = SimpleNamespace(role="field_assistant", supervisor=supervisor)

    permissions = get_effective_admin_permissions(assistant)

    assert permissions["activity_advice"] is False
    assert permissions["sport_advice"] is True
