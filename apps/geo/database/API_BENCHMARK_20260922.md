# GEO production API benchmark

Measured: 2026-09-22
Target: https://cf278796.cloudfree.jp/geo/
Client: YWSHTMR
Method: five sequential HTTPS requests per endpoint using curl time_total.

| endpoint | average | max | samples (seconds) |
| --- | ---: | ---: | --- |
| stats.php | 0.296 s | 1.204 s | 1.204, 0.062, 0.088, 0.073, 0.052 |
| stations.php?q=住吉 | 0.067 s | 0.094 s | 0.094, 0.067, 0.063, 0.050, 0.062 |
| lines.php?q=五能線 | 0.100 s | 0.216 s | 0.216, 0.080, 0.058, 0.074, 0.073 |
| addresses.php?q=七日町 | 0.261 s | 1.022 s | 1.022, 0.066, 0.063, 0.076, 0.075 |
| same-name.php?q=住吉 | 0.070 s | 0.087 s | 0.067, 0.064, 0.087, 0.076, 0.056 |
| line-stations.php?q=五能線 | 0.090 s | 0.205 s | 0.205, 0.077, 0.057, 0.064, 0.049 |

The first request to stats and addresses shows a cold-start / cache-warmup cost around one second. Subsequent requests in the same run were generally around 0.05 to 0.09 seconds. No strict performance SLO is adopted yet; these measurements are the production baseline for later regression checks.
