import unittest
from types import SimpleNamespace

from utils.privacy import (
    ROLE_PRIVACY_DEFAULTS,
    get_child_privacy_enabled,
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
            "birth_place": "Toshkent",
            "preschool_institution": "12-maktab",
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
                    "birth_place",
                    "preschool_institution",
                ):
                    self.assertNotIn(field, result)
                self.assertEqual(result["birth_date"], "2015-04-18")
                self.assertEqual(result["address"], "Toshkent, aniq manzil")
                self.assertEqual(result["parents_phone"], "+998901234567")
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
        self.assertEqual(hidden["birth_date"], "2015-04-18")
        self.assertFalse(should_redact_child_pii("researcher"))

    def test_forced_report_redaction_works_without_viewer(self):
        result = redact_child_payload(
            {
                "id": 7,
                "first_name": "Ali",
                "birth_place": "Secret",
                "address": "Visible address",
                "birth_date": "2015-04-18",
            },
            force=True,
        )
        self.assertNotIn("first_name", result)
        self.assertNotIn("birth_place", result)
        self.assertEqual(result["address"], "Visible address")
        self.assertEqual(result["birth_date"], "2015-04-18")

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
        self.assertEqual(result["patient_info"]["birth_date"], "2015-04-18")
        self.assertEqual(result["patient_info"]["id_code"], "MC-11")

    def test_camel_case_report_fields_follow_same_policy(self):
        result = redact_child_payload(
            {
                "firstName": "Ali",
                "lastName": "Valiyev",
                "birthPlace": "Toshkent",
                "birthDate": "2015-04-18",
                "preschoolInstitution": "12-maktab",
            },
            privacy_enabled=True,
        )
        self.assertNotIn("firstName", result)
        self.assertNotIn("lastName", result)
        self.assertNotIn("birthPlace", result)
        self.assertNotIn("preschoolInstitution", result)
        self.assertEqual(result["birthDate"], "2015-04-18")

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
        self.assertEqual(hidden["parents_phone"], "+998901234567")

    def test_privacy_role_aliases_are_normalized(self):
        self.assertEqual(normalize_privacy_role("assistant"), "field_assistant")
        self.assertEqual(normalize_privacy_role("field-assistant"), "field_assistant")
        self.assertEqual(normalize_privacy_role(" Super Admin "), "superadmin")

    def test_role_defaults_match_initial_policy(self):
        self.assertTrue(ROLE_PRIVACY_DEFAULTS["superadmin"])
        self.assertTrue(ROLE_PRIVACY_DEFAULTS["admin"])
        self.assertTrue(ROLE_PRIVACY_DEFAULTS["field_assistant"])
        self.assertFalse(ROLE_PRIVACY_DEFAULTS["researcher"])

    def test_settings_lookup_failure_fails_closed(self):
        class BrokenDb:
            def query(self, _model):
                raise RuntimeError("settings database is unavailable")

        self.assertTrue(get_child_privacy_enabled(BrokenDb(), "researcher"))

    def test_invalid_null_setting_fails_closed(self):
        class Query:
            def __init__(self, enabled):
                self.enabled = enabled

            def filter(self, *_args):
                return self

            def first(self):
                return SimpleNamespace(child_data_privacy_enabled=self.enabled)

        class Db:
            def __init__(self, enabled):
                self.enabled = enabled

            def query(self, _model):
                return Query(self.enabled)

        self.assertTrue(get_child_privacy_enabled(Db(None), "researcher"))
        self.assertFalse(get_child_privacy_enabled(Db(False), "researcher"))


if __name__ == "__main__":
    unittest.main()
