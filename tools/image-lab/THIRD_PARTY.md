# Third-party library notices

The published application bundle contains the following third-party software. Each is copied under its original license; corresponding notices are in `licenses/`. The app's own unmodified source is available in the public GitHub repository.

| Package | Version | License | Repository |
|---|---|---|---|
| d3-voronoi | 1.1.4 | BSD-3-Clause | https://github.com/d3/d3-voronoi |
| robust-predicates | 3.0.3 | Unlicense | https://github.com/mourner/robust-predicates |
| delaunator | 5.0.1 | ISC | https://github.com/mapbox/delaunator |
| earcut | 3.0.2 | ISC | https://github.com/mapbox/earcut |
| roughjs | 4.6.6 | MIT | https://github.com/pshihn/rough |
| pts | 1.0.1 | Apache-2.0 | https://github.com/williamngan/pts |
| paper | 0.12.18 | MIT | https://github.com/paperjs/paper.js |
| glfx | 0.0.4 | MIT | https://github.com/evanw/glfx.js |

## Distribution boundary

- Node-only development dependencies such as esbuild are excluded from the deployed browser bundle.
- Original image pixels remain on the device. No CDN library script or remote image-processing API is used.
- Trianglify 4.1.1 is **not shipped**: the upstream GPL-3.0 license requires a separate compatibility review.
- Other ideas (p5, PIXI, SVGPathCommander, SVGO, VTracer, Clipper2) are future research only.
