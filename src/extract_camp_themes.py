import openpyxl
import json

import openpyxl
import json

def extract_camp_themes(sheet_name, camp_key):
    wb = openpyxl.load_workbook('Stovyklu_datos.xlsx')
    ws = wb[sheet_name]
    themes = []
    # Skip header rows (first two rows)
    for row in ws.iter_rows(min_row=3, values_only=True):
        theme = row[0]
        if theme is None or str(theme).strip() == '':
            continue
        for date in row[1:]:
            if date and str(date).strip():
                themes.append(f"{theme.strip()} – {str(date).strip()}")
    return camp_key, themes

camp_themes = {}
for sheet, key in [("Bricks", "bricks4kidz"), ("Medicina", "lms")]:
    camp, themes = extract_camp_themes(sheet, key)
    camp_themes[camp] = themes

with open('camp_themes.json', 'w', encoding='utf-8') as f:
    json.dump(camp_themes, f, ensure_ascii=False, indent=2)
