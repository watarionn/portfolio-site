<?php
// Production target: /geo/config.php next to index.php.\n// Keep the real file server-only; deployment excludes config.php.
// Never commit the real password.
define('GEO_DB_HOST', 'localhost');
define('GEO_DB_NAME', 'cf278796_geo');
define('GEO_DB_USER', 'cf278796_geo');
define('GEO_DB_PASS', 'REPLACE_ON_SERVER');
define('GEO_DB_CHARSET', 'utf8mb4');
