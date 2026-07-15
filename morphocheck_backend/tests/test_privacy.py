import unittest
from types import SimpleNamespace

from utils.privacy import (
    ROLE_PRIVACY_DEFAULTS,
    normalize_privacy_role,
    redact_child_payload,
    redact_research_child_payload,
    should_redact_child_pii,
)


class ChildPrivacyTests(unittest.TestCase):
    def test_private_fields_are_removed(self):
        payload = {
            "id": 42,
            "id_code": "MC-0042",
            "name": "Ali Valiyev",
            "first_name": "Ali",
            "last_name": "Valiyev",
            "birth_date": "2015-04-18",
            "address": "Toshkent, aniq manzil",
            "parents_phone": "+998901234567",
            "height": 142.0,
        }

        for role in ("admin", "superadmin", "field_assistant"):
            with self.subTest(role=role):
                result = redact_child_payload(payload, SimpleNamespace(role=role))
                for field in (
                    "name",
                    "first_name",
                    "last_name",
                    "birth_date",
                    "address",
                    "parents_phone",
                ):
                    self.assertNotIn(field, result)
                self.assertEqual(result["id_code"], "MC-0042")
                self.assertEqual(result["height"], 142.0)
                self.assertTrue(result["privacy_redacted"])

    def test_researcher_setting_can_show_or_hide_data(self):
        payload = {
            "id_code": "MC-9",
            "full_name": "Ali Valiyev",
            "birth_date": "2015-04-18",
        }
        visible = redact_child_payload(
            payload, SimpleNamespace(role="researcher"), privacy_enabled=False
        )
        hidden = redact_child_payload(
            payload, SimpleNamespace(role="researcher"), privacy_enabled=True
        )

        self.assertEqual(visible, {**payload, "privacy_redacted": False})
        self.assertNotIn("full_name", hidden)
        self.assertNotIn("birth_date", hidden)
        self.assertFalse(should_redact_child_pii("researcher"))

    def test_forced_report_redaction_works_without_viewer(self):
        result = redact_child_payload(
            {"id": 7, "first_name": "Ali", "address": "Secret"}, force=True
        )
        self.assertNotIn("first_name", result)
        self.assertNotIn("address", result)

    def test_nested_patient_info_is_redacted(self):
        result = redact_child_payload(
            {
                "id": 11,
                "patient_info": {
                    "id_code": "MC-11",
                    "full_name": "Ali Valiyev",
                    "birth_date": "2015-04-18",
                },
            },
            SimpleNamespace(role="field_assistant"),
        )
        self.assertNotIn("full_name", result["patient_info"])
        self.assertNotIn("birth_date", result["patient_info"])
        self.assertEqual(result["patient_info"]["id_code"], "MC-11")

    def test_research_context_uses_explicit_setting(self):
        payload = {
            "id_code": "R-15",
            "full_name": "Ali Valiyev",
            "school_name": "12-maktab",
            "parents_phone": "+998901234567",
        }
        viewer = SimpleNamespace(role="superadmin")
        visible = redact_research_child_payload(
            payload, viewer, privacy_enabled=False
        )
        hidden = redact_research_child_payload(
            payload, viewer, privacy_enabled=True
        )

        self.assertEqual(visible, {**payload, "privacy_redacted": False})
        self.assertNotIn("full_name", hidden)
        self.assertNotIn("school_name", hidden)
        self.assertNotIn("parents_phone", hidden)

    def test_privacy_role_aliases_are_normalized(self):
        self.assertEqual(normalize_privacy_role("assistant"), "field_assistant")
        self.assertEqual(normalize_privacy_role("field-assistant"), "field_assistant")
        self.assertEqual(normalize_privacy_role(" Super Admin "), "superadmin")

    def test_role_defaults_match_initial_policy(self):
        self.assertTrue(ROLE_PRIVACY_DEFAULTS["superadmin"])
        self.assertTrue(ROLE_PRIVACY_DEFAULTS["admin"])
        self.assertTrue(ROLE_PRIVACY_DEFAULTS["field_assistant"])
        self.assertFalse(ROLE_PRIVACY_DEFAULTS["researcher"])


if __name__ == "__main__":
    unittest.main()
