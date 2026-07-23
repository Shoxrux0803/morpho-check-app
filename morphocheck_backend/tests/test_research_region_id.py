import unittest
from types import SimpleNamespace

from models.userdata import ResearchRecord
from routers.research_router import _research_record_id_region


class ResearchRecordRegionIdTests(unittest.TestCase):
    def test_assigned_researcher_region_has_priority_over_settlement(self):
        record = ResearchRecord(
            settlement="Chilonzor tumani",
            birth_place="Samarqand",
        )
        owner = SimpleNamespace(region="Toshkent shahri")

        self.assertEqual(
            _research_record_id_region(record, owner),
            "Toshkent shahri",
        )

    def test_location_is_used_when_owner_has_no_assigned_region(self):
        record = ResearchRecord(
            settlement="Samarqand",
            birth_place="Buxoro",
        )
        owner = SimpleNamespace(region=None)

        self.assertEqual(_research_record_id_region(record, owner), "Samarqand")


if __name__ == "__main__":
    unittest.main()
