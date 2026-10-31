"""Track numeric input origins without inferring origins for historical rows."""
from sqlalchemy import Float, Integer

PROVENANCE_VERSION = "measurement-provenance-v1"


def input_sources(record, values, source):
    columns = {column.name: column for column in record.__table__.columns}
    return {
        key: source for key, value in values.items()
        if key in columns and isinstance(columns[key].type, (Float, Integer))
        and value is not None and not key.endswith("_id")
        and not key.startswith("consent_")
    }
