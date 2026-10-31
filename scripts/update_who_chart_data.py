"""Refresh chart-only reference curves from WHO 2007 expanded tables.

Run with the backend virtualenv Python. Clinical Z-score calculations remain
owned by the backend; this file supplies display curves only.
"""
import html
import io
import json
from pathlib import Path
from html.parser import HTMLParser

import openpyxl
import requests


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            url = dict(attrs).get("href", "")
            if ".xlsx" in url and "-z-" in url:
                self.urls.append(html.unescape(url))


def main():
    output = {"boys": {}, "girls": {}}
    sources = {}
    headers = {"User-Agent": "Mozilla/5.0"}
    for indicator, page in (
        ("heightForAge", "height-for-age"),
        ("bmiForAge", "bmi-for-age"),
        ("weightForAge", "weight-for-age-5to10-years"),
    ):
        page_url = "https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/" + page
        response = requests.get(page_url, headers=headers, timeout=30)
        response.raise_for_status()
        links = Links()
        links.feed(response.text)
        for gender in output:
            url = next(url for url in links.urls if gender in url)
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            workbook = openpyxl.load_workbook(io.BytesIO(response.content), data_only=True)
            rows = list(workbook.active.values)
            columns = {str(value): index for index, value in enumerate(rows[0])}
            assert "Month" in columns and "SD0" in columns, rows[0]
            keys = {"sd3neg": "SD3neg", "sd2neg": "SD2neg", "sd1neg": "SD1neg", "median": "SD0", "sd1pos": "SD1", "sd2pos": "SD2", "sd3pos": "SD3"}
            output[gender][indicator] = [
                {"age": row[columns["Month"]] / 12, **{key: row[columns[column]] for key, column in keys.items()}}
                for row in rows[1:] if isinstance(row[columns["Month"]], (float, int))
            ]
            sources[f"{gender}.{indicator}"] = url
            print(gender, indicator, len(output[gender][indicator]))
    output["metadata"] = {"version": "WHO-2007-expanded-z-tables", "sources": sources, "note": "Reference begins at 61 months; weight-for-age ends at 120 months."}
    destination = Path(__file__).resolve().parents[1] / "src" / "data" / "who2007Charts.json"
    destination.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__":
    main()
