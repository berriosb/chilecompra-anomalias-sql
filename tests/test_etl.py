"""Tests unitarios del pipeline ETL sin datasets ni servicios remotos."""

from pathlib import Path
import sys

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from etl import clean_awards  # noqa: E402


def test_clean_awards_filters_invalid_amounts_and_normalizes_id() -> None:
    awards = pd.DataFrame(
        {
            "id": ["valid", "zero", "negative", "missing"],
            "value_amount": [1250.9, 0.0, -10.0, None],
            "date": ["2024-01-01"] * 4,
        }
    )

    result = clean_awards(awards)

    assert result["oc_id"].tolist() == ["valid"]
    assert result["value_amount"].tolist() == [1250.9]
    assert "id" not in result.columns


def test_clean_awards_returns_empty_frame_when_every_amount_is_invalid() -> None:
    awards = pd.DataFrame(
        {
            "id": ["zero", "missing"],
            "value_amount": [0.0, None],
        }
    )

    result = clean_awards(awards)

    assert result.empty
    assert list(result.columns) == ["oc_id", "value_amount"]
