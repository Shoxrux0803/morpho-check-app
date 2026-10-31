"""Read-only source audit. Recompute the supplied workbook's arithmetic safely.

Usage: python scripts/audit_index_v6.py --config CONFIG.json --reference REFERENCE.xlsx
"""

import argparse
import ast
import hashlib
import json
import operator
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "morphocheck_backend"))
from services.index_model_v6 import MODEL, calculate_v6

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SHEETS = [
    "00_README",
    "01_FORMULALAR",
    "02_PARAMS",
    "03_ICHKI_REF",
    "04_WHO_LMS",
    "05_TEST_HISOB",
    "06_QC_HULOSA",
    "07_IMPORT_MAYDON",
]


def read_workbook(path):
    sheets = []
    with zipfile.ZipFile(path) as archive:
        for i in range(1, 9):
            rows = []
            for row in ET.fromstring(
                archive.read(f"xl/worksheets/sheet{i}.xml")
            ).findall(".//s:sheetData/s:row", NS):
                cells = {}
                for cell in row:
                    value, text, formula = (
                        cell.find("s:v", NS),
                        cell.find("s:is", NS),
                        cell.find("s:f", NS),
                    )
                    cells[cell.get("r")] = {
                        "value": value.text
                        if value is not None
                        else "".join(text.itertext())
                        if text is not None
                        else None,
                        "formula": formula.text if formula is not None else None,
                    }
                rows.append(cells)
            sheets.append(rows)
    return sheets


class ArithmeticWorkbook:
    """A deliberately small AST interpreter: references, + - * /, ABS/MIN/MAX/SUM.

    No workbook text is executed as Python or shell instructions.
    """

    def __init__(self, sheets):
        self.cells = {
            (name, address): cell
            for name, rows in zip(SHEETS, sheets)
            for row in rows
            for address, cell in row.items()
        }
        self.memo = {}

    def value(self, sheet, address):
        key = (sheet, address.replace("$", ""))
        if key in self.memo:
            return self.memo[key]
        cell = self.cells[key]
        if cell["formula"] is None:
            return float(cell["value"])
        expression = cell["formula"]
        # The supplied reference has one range: SUM(B6:B10).
        expression = re.sub(r"SUM\(B6:B10\)", "SUM(B6,B7,B8,B9,B10)", expression)
        refs = []

        def reference(match):
            ref_sheet = match.group(1) or sheet
            refs.append(self.value(ref_sheet, match.group(2)))
            return f"v{len(refs) - 1}"

        expression = re.sub(
            r"(?:'([^']+)'!)?(\$?[A-Z]{1,3}\$?\d+)", reference, expression
        )
        tree = ast.parse(expression, mode="eval")
        operations = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
        }
        functions = {
            "ABS": abs,
            "MIN": min,
            "MAX": max,
            "SUM": lambda *values: sum(values),
        }

        def evaluate(node):
            if isinstance(node, ast.Expression):
                return evaluate(node.body)
            if isinstance(node, ast.Constant) and type(node.value) in (float, int):
                return node.value
            if isinstance(node, ast.Name) and re.fullmatch(r"v\d+", node.id):
                return refs[int(node.id[1:])]
            if isinstance(node, ast.BinOp) and type(node.op) in operations:
                return operations[type(node.op)](
                    evaluate(node.left), evaluate(node.right)
                )
            if isinstance(node, ast.UnaryOp) and isinstance(
                node.op, (ast.UAdd, ast.USub)
            ):
                return evaluate(node.operand) * (
                    -1 if isinstance(node.op, ast.USub) else 1
                )
            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id in functions
                and not node.keywords
            ):
                return functions[node.func.id](*(evaluate(arg) for arg in node.args))
            raise ValueError(f"Unsupported arithmetic: {ast.dump(node)}")

        result = evaluate(tree)
        self.memo[key] = result
        return result


def run(config_path, workbook_path):
    source_config = json.loads(config_path.read_text(encoding="utf-8-sig"))
    sheets = read_workbook(workbook_path)
    frozen = json.loads(
        (ROOT / "morphocheck_backend/tests/fixtures/index_v6_workbook.json").read_text(
            encoding="utf-8"
        )
    )
    assert source_config == MODEL, "Project config differs from supplied JSON"
    assert sheets == frozen, "Workbook differs from the audited fixture"
    arithmetic = ArithmeticWorkbook(sheets)
    formula_count, formula_error = 0, 0
    for (sheet, address), cell in arithmetic.cells.items():
        if cell["formula"]:
            calculated = arithmetic.value(sheet, address)
            error = abs(calculated - float(cell["value"]))
            assert error < 1e-8, (sheet, address, error)
            formula_count += 1
            formula_error = max(formula_error, error)
    cases = []
    for row in sheets[5][2:]:
        cells = {re.sub(r"\d", "", key): value["value"] for key, value in row.items()}
        inputs = dict(
            zip(
                (
                    "age_months",
                    "sex",
                    "height_cm",
                    "weight_kg",
                    "ffm_kg",
                    "thigh_circ_cm",
                    "calf_circ_cm",
                    "upper_arm_circ_cm",
                ),
                (cells[col] for col in "BCDEFGHI"),
            )
        )
        result = calculate_v6(**inputs)
        errors = {
            key: abs(result[key] - float(cells[col]))
            for key, col in zip(("hmai", "mii", "adi", "mcri"), ("X", "Y", "Z", "AA"))
        }
        assert max(errors.values()) < 1e-8
        cases.append({"id": cells["A"], "errors_vs_source": errors})
    return {
        "status": "PASS",
        "model_version": "6.0",
        "source_sha256": {
            p.name: hashlib.sha256(p.read_bytes()).hexdigest()
            for p in (config_path, workbook_path)
        },
        "sheets": len(sheets),
        "who_lms_rows": len(MODEL["who_lms_source_rows"]),
        "internal_reference_rows": len(MODEL["internal_reference"]["rows"]),
        "recomputed_excel_formulas": formula_count,
        "max_formula_cache_error": formula_error,
        "reference_cases": len(cases),
        "max_model_source_error": max(
            max(case["errors_vs_source"].values()) for case in cases
        ),
        "cases": cases,
        "limits": [
            "The reference contains 13 cases, not the full 2038-person source dataset.",
            "WHO LMS and device protocols were compared to supplied files, not independently validated.",
            "The interpreter verifies supported arithmetic; Excel itself was not launched.",
            "Stored historical analyses were not bulk overwritten.",
        ],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument(
        "--output", type=Path, default=ROOT / "outputs/index_v6_audit.json"
    )
    args = parser.parse_args()
    report = run(args.config, args.reference)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        json.dumps(
            {
                k: v
                for k, v in report.items()
                if k not in {"cases", "source_sha256", "limits"}
            },
            indent=2,
        )
    )
