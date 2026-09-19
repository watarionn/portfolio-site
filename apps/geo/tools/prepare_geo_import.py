#!/usr/bin/env python3
"""Prepare CP932 GEO source CSVs as normalized UTF-8 MariaDB imports.

The line/station masters contain historical revisions with reused source codes.
Rows are ordered old -> new in the adopted snapshot, so the final occurrence of
each code is the canonical current record. Raw counts remain in manifest.json.
"""
from __future__ import annotations
import argparse,csv,json
from pathlib import Path
STATION_COLUMNS=["station_code","station_name","station_reading","longitude","latitude","prefecture_code"]
STATION_LINE_COLUMNS=["station_code","line_code","source_order"]
LINE_COLUMNS=["line_code","line_name","line_name_short","line_name_abbrev","line_reading","corp_type"]
ADDRESS_COLUMNS=["address_code","postal_code","prefecture_code","prefecture_name","municipality_name","town_name","block_name","prefecture_kana","municipality_kana","town_kana","block_kana","street_name_flag","common_name_flag","is_last"]
def clean(v): return "" if v is None else v.strip()
def writer(path,cols):
 h=path.open("w",encoding="utf-8",newline="");w=csv.DictWriter(h,fieldnames=cols);w.writeheader();return h,w
def main():
 p=argparse.ArgumentParser();p.add_argument("--stations",required=True,type=Path);p.add_argument("--lines",required=True,type=Path);p.add_argument("--addresses",required=True,type=Path);p.add_argument("--output",required=True,type=Path);p.add_argument("--address-chunk-size",type=int,default=50000);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
 lines={};line_source_count=0
 with a.lines.open("r",encoding="cp932",newline="") as f:
  for r in csv.DictReader(f):
   line_source_count+=1;c=clean(r.get("ENSCD"));lines[c]=dict(zip(LINE_COLUMNS,[c,clean(r.get("ENSNM")),clean(r.get("ENSNM2")),clean(r.get("ENSNM3")),clean(r.get("ENSNMK")),clean(r.get("CORP_TYPE"))]))
 h,w=writer(a.output/"geo_lines.csv",LINE_COLUMNS)
 for x in lines.values():w.writerow(x)
 h.close()
 stations={};membership={};station_source_count=0
 with a.stations.open("r",encoding="cp932",newline="") as f:
  for order,r in enumerate(csv.DictReader(f),1):
   station_source_count+=1;sc=clean(r.get("EKICD"));lc=clean(r.get("ENSCD"))
   stations[sc]=dict(zip(STATION_COLUMNS,[sc,clean(r.get("EKINM")),clean(r.get("EKINMK")),clean(r.get("LNG")),clean(r.get("LAT")),clean(r.get("JUCD"))]))
   membership[(sc,lc)]=order
 h,w=writer(a.output/"geo_stations.csv",STATION_COLUMNS)
 for x in stations.values():w.writerow(x)
 h.close();h,w=writer(a.output/"geo_station_lines.csv",STATION_LINE_COLUMNS)
 for (sc,lc),order in sorted(membership.items(),key=lambda x:x[1]):w.writerow({"station_code":sc,"line_code":lc,"source_order":order})
 h.close()
 address_count=0;codes=set();part=0;ah=aw=None
 def open_part(n):
  return writer((a.output/"geo_addresses.csv").with_name(f"geo_addresses-{n:02d}.csv"),ADDRESS_COLUMNS)
 with a.addresses.open("r",encoding="cp932",newline="") as f:
  for r in csv.DictReader(f):
   if address_count%a.address_chunk_size==0:
    if ah:ah.close()
    part+=1;ah,aw=open_part(part)
   code=clean(r.get("JUCD"));codes.add(code)
   vals=[code,clean(r.get("POST_POSTCD")),code[:2],clean(r.get("JUNM1")),clean(r.get("JUNM2")),clean(r.get("JUNM3")),clean(r.get("JUNM4")),clean(r.get("JUNMK1")),clean(r.get("JUNMK2")),clean(r.get("JUNMK3")),clean(r.get("JUNMK4")),clean(r.get("TOORINA_FLAG")),clean(r.get("TUUSHOU_FLAG")),clean(r.get("IS_LAST"))]
   aw.writerow(dict(zip(ADDRESS_COLUMNS,vals)));address_count+=1
 if ah:ah.close()
 manifest={"encoding":"utf-8","revision_policy":"last source occurrence wins for duplicated ENSCD/EKICD","line_source_records":line_source_count,"lines":len(lines),"station_source_records":station_source_count,"stations":len(stations),"station_lines":len(membership),"address_records":address_count,"unique_address_codes":len(codes),"address_parts":part}
 expected={"line_source_records":591,"lines":554,"station_source_records":11147,"stations":10860,"station_lines":10860,"address_records":495147,"unique_address_codes":487728}
 manifest["expected"]=expected;manifest["verified"]=all(manifest[k]==v for k,v in expected.items());(a.output/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 if not manifest["verified"]:raise SystemExit("Source count verification failed: "+json.dumps(manifest,ensure_ascii=False))
 print(json.dumps(manifest,ensure_ascii=False))
if __name__=="__main__":main()
