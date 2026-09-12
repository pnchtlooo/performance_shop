#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Разбор результатов JMeter (.jtl, формат CSV) и проверка соответствия SLO
из ТЗ (95-й перцентиль по каждому методу). Работает только на стандартной
библиотеке Python — не требует pandas/numpy.

Использование:
    python3 analyze_results.py results.jtl

Скрипт группирует сэмплы по label (метка сэмплера в JMeter, у нас в формате
"[1x] METHOD /path"), поэтому 1x/2x/3x считаются отдельно.
Для лейблов, которых нет в SLO_MAP (Transaction Controller-ы, служебные
метки), просто выводится статистика без вердикта.
"""
import csv
import sys
import math
from collections import defaultdict

# SLO (95-й перцентиль) в миллисекундах, из ТЗ
SLO_MAP = {
    "POST /api/auth/login": 150,
    "GET /api/auth/profile": 150,
    "GET /api/products": 150,
    "GET /api/products/{id}": 150,
    "POST /api/orders": 5000,
    "GET /api/orders/{id}": 5000,
    "GET /api/reports/sales": 60000,
    "GET /api/reports/slow": 2000,
    "POST /api/reports/generate": 60000,
    "GET /api/health": 1000,
}


def base_label(label: str) -> str:
    # "[1x] GET /api/products" -> "GET /api/products"
    if label.startswith("[") and "]" in label:
        return label.split("]", 1)[1].strip()
    return label


def percentile(sorted_vals, p):
    if not sorted_vals:
        return None
    n = len(sorted_vals)
    idx = max(0, min(n - 1, math.ceil(p / 100.0 * n) - 1))
    return sorted_vals[idx]


def main():
    if len(sys.argv) != 2:
        print("Использование: python3 analyze_results.py <results.jtl>")
        sys.exit(1)

    path = sys.argv[1]
    data = defaultdict(list)  # label -> [elapsed,...]
    errors = defaultdict(int)
    totals = defaultdict(int)

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            label = row.get("label", "")
            elapsed = row.get("elapsed")
            success = row.get("success", "true")
            if elapsed is None:
                continue
            try:
                elapsed = float(elapsed)
            except ValueError:
                continue
            data[label].append(elapsed)
            totals[label] += 1
            if success not in ("true", "True", "1"):
                errors[label] += 1

    print(f"{'Метка (этап + эндпоинт)':45s} {'N':>7s} {'Err%':>6s} {'p50':>8s} {'p90':>8s} {'p95':>8s} {'p99':>8s} {'SLO':>8s} {'Вердикт':>10s}")
    print("-" * 112)

    for label in sorted(data.keys()):
        vals = sorted(data[label])
        n = totals[label]
        err_pct = 100.0 * errors[label] / n if n else 0.0
        p50 = percentile(vals, 50)
        p90 = percentile(vals, 90)
        p95 = percentile(vals, 95)
        p99 = percentile(vals, 99)

        slo = SLO_MAP.get(base_label(label))
        if slo is not None:
            verdict = "OK" if (p95 is not None and p95 <= slo) else "FAIL"
            slo_str = f"{slo:.0f}"
        else:
            verdict = "-"
            slo_str = "-"

        print(f"{label:45s} {n:7d} {err_pct:6.2f} {p50:8.0f} {p90:8.0f} {p95:8.0f} {p99:8.0f} {slo_str:>8s} {verdict:>10s}")

    print("\nПримечание: вердикт считается только по p95 (как задано в ТЗ).")
    print("CPU/RAM по контейнерам — смотри отдельно resource_usage.csv (monitor_resources.sh),")
    print("сопоставляя по времени с этапами 1x/2x/3x (см. таймстемпы делэев в README).")


if __name__ == "__main__":
    main()
