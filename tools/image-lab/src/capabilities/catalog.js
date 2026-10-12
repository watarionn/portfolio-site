/** Each available capability has an actual vendor-backed adapter.\n * Success is recorded only after running the adapter, never inferred from registration. */
export const CAPABILITY_GROUPS = [
 {
  "id": "d3-voronoi",
  "name": "d3-voronoi",
  "items": [
   {
    "id": "polygons",
    "label": "セル輪郭",
    "status": "available"
   },
   {
    "id": "links",
    "label": "点の隣接リンク",
    "status": "available"
   },
   {
    "id": "triangles",
    "label": "三角形",
    "status": "available"
   },
   {
    "id": "find",
    "label": "最近傍点",
    "status": "available"
   }
  ]
 },
 {
  "id": "delaunator",
  "name": "Delaunator",
  "items": [
   {
    "id": "triangles",
    "label": "三角分割",
    "status": "available"
   },
   {
    "id": "hull",
    "label": "凸包",
    "status": "available"
   },
   {
    "id": "halfedges",
    "label": "半辺配列",
    "status": "available"
   },
   {
    "id": "update",
    "label": "座標変更と再計算",
    "status": "available"
   }
  ]
 },
 {
  "id": "earcut",
  "name": "Earcut",
  "items": [
   {
    "id": "simple",
    "label": "単純多角形",
    "status": "available"
   },
   {
    "id": "holes",
    "label": "穴あき多角形",
    "status": "available"
   },
   {
    "id": "flatten",
    "label": "座標データ変換",
    "status": "available"
   },
   {
    "id": "deviation",
    "label": "面積誤差",
    "status": "available"
   }
  ]
 },
 {
  "id": "pts",
  "name": "Pts.js",
  "items": [
   {
    "id": "distance",
    "label": "2点間距離",
    "status": "available"
   },
   {
    "id": "midpoint",
    "label": "線分の中点",
    "status": "available"
   },
   {
    "id": "transform",
    "label": "点のベクトル移動",
    "status": "available"
   }
  ]
 },
 {
  "id": "rough",
  "name": "Rough.js",
  "items": [
   {
    "id": "shapes",
    "label": "基本図形",
    "status": "available"
   },
   {
    "id": "hachure",
    "label": "斜線塗り",
    "status": "available"
   },
   {
    "id": "cross-hatch",
    "label": "クロスハッチ",
    "status": "available"
   },
   {
    "id": "dots",
    "label": "点描塗り",
    "status": "available"
   },
   {
    "id": "sunburst",
    "label": "放射塗り",
    "status": "available"
   },
   {
    "id": "zigzag",
    "label": "ジグザグ塗り",
    "status": "available"
   },
   {
    "id": "svgpath",
    "label": "SVGパス描画",
    "status": "available"
   }
  ]
 },
 {
  "id": "paper",
  "name": "Paper.js",
  "items": [
   {
    "id": "unite",
    "label": "図形の結合",
    "status": "available"
   },
   {
    "id": "intersect",
    "label": "図形の交差",
    "status": "available"
   },
   {
    "id": "subtract",
    "label": "図形の差",
    "status": "available"
   },
   {
    "id": "simplify",
    "label": "パス単純化",
    "status": "available"
   },
   {
    "id": "smooth",
    "label": "曲線化",
    "status": "available"
   },
   {
    "id": "export",
    "label": "SVG書き出し",
    "status": "available"
   }
  ]
 },
 {
  "id": "glfx",
  "name": "glfx.js",
  "items": [
   {
    "id": "contrast",
    "label": "明るさ・コントラスト",
    "status": "available"
   },
   {
    "id": "hue",
    "label": "色相・彩度",
    "status": "available"
   },
   {
    "id": "vignette",
    "label": "周辺減光",
    "status": "available"
   },
   {
    "id": "hex",
    "label": "六角形ピクセル",
    "status": "available"
   },
   {
    "id": "dots",
    "label": "ドットスクリーン",
    "status": "available"
   },
   {
    "id": "blur",
    "label": "ブラー",
    "status": "available"
   },
   {
    "id": "ink",
    "label": "輪郭インク",
    "status": "available"
   },
   {
    "id": "swirl",
    "label": "渦変形",
    "status": "available"
   }
  ]
 },
 {
  "id": "p5",
  "name": "p5.js",
  "items": [
   {
    "id": "gray",
    "label": "グレー",
    "status": "available"
   },
   {
    "id": "invert",
    "label": "反転",
    "status": "available"
   },
   {
    "id": "threshold",
    "label": "二値化",
    "status": "available"
   },
   {
    "id": "posterize",
    "label": "ポスタライズ",
    "status": "available"
   },
   {
    "id": "blur",
    "label": "ブラー",
    "status": "available"
   },
   {
    "id": "erode",
    "label": "収縮",
    "status": "available"
   },
   {
    "id": "dilate",
    "label": "膨張",
    "status": "available"
   }
  ]
 },
 {
  "id": "pixi",
  "name": "PixiJS",
  "items": [
   {
    "id": "blur",
    "label": "ブラー",
    "status": "available"
   },
   {
    "id": "noise",
    "label": "ノイズ",
    "status": "available"
   },
   {
    "id": "color",
    "label": "色マトリクス",
    "status": "available"
   },
   {
    "id": "alpha",
    "label": "透明度",
    "status": "available"
   }
  ]
 },
 {
  "id": "svgpath",
  "name": "SVGPathCommander",
  "items": [
   {
    "id": "optimize",
    "label": "パス最適化",
    "status": "available"
   },
   {
    "id": "reverse",
    "label": "パス反転",
    "status": "available"
   },
   {
    "id": "absolute",
    "label": "絶対座標変換",
    "status": "available"
   },
   {
    "id": "transform",
    "label": "アフィン変換",
    "status": "available"
   }
  ]
 },
 {
  "id": "svgo",
  "name": "SVGO",
  "items": [
   {
    "id": "default",
    "label": "標準最適化",
    "status": "available"
   },
   {
    "id": "multipass",
    "label": "複数回最適化",
    "status": "available"
   },
   {
    "id": "pretty",
    "label": "読みやすい整形",
    "status": "available"
   },
   {
    "id": "preserve",
    "label": "viewBox保持",
    "status": "available"
   }
  ]
 },
 {
  "id": "vtracer",
  "name": "VTracer WASM",
  "items": [
   {
    "id": "color",
    "label": "カラーベクター化",
    "status": "available"
   },
   {
    "id": "binary",
    "label": "二値トレース",
    "status": "available"
   }
  ]
 },
 {
  "id": "clipper",
  "name": "Clipper2-WASM",
  "items": [
   {
    "id": "intersection",
    "label": "ポリゴン交差",
    "status": "available"
   },
   {
    "id": "union",
    "label": "ポリゴン和",
    "status": "available"
   },
   {
    "id": "difference",
    "label": "ポリゴン差",
    "status": "available"
   },
   {
    "id": "xor",
    "label": "排他的論理和",
    "status": "available"
   }
  ]
 },
 {
  "id": "onnx",
  "name": "ONNX Runtime Web",
  "items": [
   {
    "id": "wasm",
    "label": "WASM実行・意味分割",
    "status": "available"
   },
   {
    "id": "webgpu",
    "label": "WebGPU (iPhone Safariは除外)",
    "status": "unsupported"
   }
  ]
 },
 {
  "id": "trianglify",
  "name": "Trianglify",
  "items": [
   {
    "id": "pattern",
    "label": "三角形パターン生成 (ライセンス保留)",
    "status": "blocked"
   }
  ]
 }
];
export const CAPABILITY_COUNT=CAPABILITY_GROUPS.reduce((n,g)=>n+g.items.length,0);
