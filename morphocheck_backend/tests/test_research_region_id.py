import unittest
from types import SimpleNamespace

from models.userdata import ResearchRecord
from routers.research_router import _research_record_id_region
from services.analyze_service import generate_region_based_id, infer_uzbekistan_region


class _EmptyQuery:
    def filter(self, *_args):
        return self

    def count(self):
        return 0


class _EmptyDb:
    def query(self, *_args):
        return _EmptyQuery()


class ResearchRecordRegionIdTests(unittest.TestCase):
    def test_known_settlement_has_priority_over_researcher_region(self):
        record = ResearchRecord(
            settlement="Бахмал, Муғол ҚФЙ",
            birth_place="Samarqand",
        )
        owner = SimpleNamespace(region="Toshkent shahri")

        self.assertEqual(
            _research_record_id_region(record, owner),
            "Jizzax",
        )

    def test_location_is_used_when_owner_has_no_assigned_region(self):
        record = ResearchRecord(
            settlement="Samarqand",
            birth_place="Buxoro",
        )
        owner = SimpleNamespace(region=None)

        self.assertEqual(_research_record_id_region(record, owner), "Samarqand")

    def test_cyrillic_district_is_resolved(self):
        self.assertEqual(infer_uzbekistan_region("Бахмал тумани"), "Jizzax")

    def test_generated_id_uses_inferred_region_prefix(self):
        self.assertEqual(
            generate_region_based_id(_EmptyDb(), "Бахмал, Муғол ҚФЙ"),
            "MC-JIZ-B-0001",
        )

    def test_district_before_mahalla_controls_the_id_region(self):
        settlements = (
            "Зарбдор, Навбаҳор ҚФЙ",
            "Зарбдор, Нурафшон ҚФЙ",
            "Зарбдор, Андижон ҚФЙ",
        )

        for settlement in settlements:
            with self.subTest(settlement=settlement):
                self.assertEqual(infer_uzbekistan_region(settlement), "Jizzax")
                self.assertEqual(
                    generate_region_based_id(_EmptyDb(), settlement),
                    "MC-JIZ-Z-0001",
                )

    def test_explicit_region_and_district_use_district_code(self):
        self.assertEqual(
            generate_region_based_id(_EmptyDb(), "Jizzax", "Baxmal tumani"),
            "MC-JIZ-B-0001",
        )

    def test_region_without_district_keeps_legacy_region_format(self):
        self.assertEqual(
            generate_region_based_id(_EmptyDb(), "Jizzax"),
            "MC-JIZ-0001",
        )

    def test_unknown_settlement_falls_back_to_owner_region(self):
        record = ResearchRecord(settlement="Муғол ҚФЙ")
        owner = SimpleNamespace(region="Toshkent shahri")

        self.assertEqual(
            _research_record_id_region(record, owner),
            "Toshkent shahri",
        )


if __name__ == "__main__":
    unittest.main()
