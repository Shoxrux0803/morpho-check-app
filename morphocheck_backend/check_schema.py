from sqlalchemy import create_engine, inspect

db_url = "sqlite:///morphocheck.db"
engine = create_engine(db_url)
inspector = inspect(engine)

print("Tables:", inspector.get_table_names())
columns = inspector.get_columns("patient_analysis")
for col in columns:
    print(f"{col['name']}: {col['type']}")
