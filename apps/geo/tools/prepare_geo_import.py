#!/usr/bin/env python3
"""Prepare CP932 GEO source CSVs as normalized UTF-8 MariaDB imports."""

from __future__ import annotations
import argparse, csv, json
from pathlib import Path

STATION_COLUMNS=["station_code","station_name","station_reading","longitude","latitude","prefecture_code"]
STATION_LINE_COLUMNS=["station_code","line_code","source_order"]
LINE_COLUMNS=["line_code","line_name","line_name_short","line_name_abbrev","line_reading","corp_type"]
ADDRESS_COLUMNS=["address_code","postal_code","prefecture_code","prefecture_name","municipality_name","town_name","block_name","prefecture_kana","municipality_kana","town_kana","block_kana","street_name_flag","common_name_flag","is_last"]

def clean(v): return "" if v is None else v.strip()
def writer(path, columns):
    h=path.open("w",encoding="utf-8",newline=""); w=csv.DictWriter(h,fieldnames=columns); w.writeheader(); return h,w
def open_address_part(base, part):
    return writer(base.with_name(f"{base.stem}-{part:02d}{base.suffix}"),ADDRESS_COLUMNS)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stations",required=True,type=Path); p.add_argument("--lines",required=True,type=Path)
    p.add_argument("--addresses",required=True,type=Path); p.add_argument("--output",required=True,type=Path)
    p.add_argument("--address-chunk-size",type=int,default=50000)
    a=p.parse_args(); a.output.mkdir(parents=True,exist_ok=True)

    # Lines: source contains 591 rows but ENSCD repeats. Keep first row per code after
    # validating that repeated codes do not disagree on canonical fields.
    lines={}
    with a.lines.open("r",encoding="cp932",newline="") as f:
        line_source_count=0
        for r in csv.DictReader(f):
            line_source_count+=1; code=clean(r.get("ENSCD"))
            row=dict(zip(LINE_COLUMNS,[code,clean(r.get("ENSNM")),clean(r.get("ENSNM2")),clean(r.get("ENSNM3")),clean(r.get("ENSNMK")),clean(r.get("CORP_TYPE"))]))
            if code in lines and lines[code] != row:
                raise ValueError(f"Conflicting line rows for ENSCD={code}")
            lines.setdefault(code,row)
    h,w=writer(a.output/"geo_lines.csv",LINE_COLUMNS)
    for row in lines.values(): w.writerow(row)
    h.close()

    stations={}; junctions=set(); station_source_count=0
    with a.stations.open("r",encoding="cp932",newline="") as f:
        for order,r in enumerate(csv.DictReader(f),1):
            station_source_count+=1; sc=clean(r.get("EKICD")); lc=clean(r.get("ENSCD"))
            row=dict(zip(STATION_COLUMNS,[sc,clean(r.get("EKINM")),clean(r.get("EKINMK")),clean(r.get("LNG")),clean(r.get("LAT")),clean(r.get("JUCD"))]))
            if sc in stations and stations[sc] != row:
                raise ValueError(f"Conflicting station rows for EKICD={sc}")
            stations.setdefault(sc,row); junctions.add((sc,lc,order))
    h,w=writer(a.output/"geo_stations.csv",STATION_COLUMNS)
    for row in stations.values(): w.writerow(row)
    h.close()
    h,w=writer(a.output/"geo_station_lines.csv",STATION_LINE_COLUMNS)
    for sc,lc,order in junctions: w.writerow({"station_code":sc,"line_code":lc,"source_order":order})
    h.close()

    address_count=0; address_codes=set(); part=1; ah,aw=open_address_part(a.output/"geo_addresses.csv",part)
    with a.addresses.open("r",encoding="cp932",newline="") as f:
        for r in csv.DictReader(f):
            if a.address_chunk_size and address_count and address_count%a.address_chunk_size==0:
                ah.close(); part+=1; ah,aw=open_address_part(a.output/"geo_addresses.csv",part)
            code=clean(r.get("JUCD")); address_codes.add(code)
            vals=[code,clean(r.get("POST_POSTCD")),code[:2],clean(r.get("JUNM1")),clean(r.get("JUNM2")),clean(r.get("JUNM3")),clean(r.get("JUNM4")),clean(r.get("JUNMK1")),clean(r.get("JUNMK2")),clean(r.get("JUNMK3")),clean(r.get("JUNMK4")),clean(r.get("TOORINA_FLAG")),clean(r.get("TUUSHOU_FLAG")),clean(r.get("IS_LAST"))]
            aw.writerow(dict(zip(ADDRESS_COLUMNS,vals))); address_count+=1
    ah.close()

    manifest={"encoding":"utf-8","line_source_records":line_source_count,"lines":len(lines),"station_source_records":station_source_count,"stations":len(stations),"station_lines":len(junctions),"address_records":address_count,"unique_address_codes":len(address_codes),"address_parts":part}
    expected={"line_source_records":591,"lines":554,"station_source_records":11147,"stations":10860,"address_records":495147,"unique_address_codes":487728}
    manifest["expected"]=expected; manifest["verified"]=all(manifest[k]==v for k,v in expected.items())
    (a.output/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if not manifest["verified"]: raise SystemExit("Source count verification failed: "+json.dumps(manifest,ensure_ascii=False))
    print(json.dumps(manifest,ensure_ascii=False))

if __name__=="__main__": main()
