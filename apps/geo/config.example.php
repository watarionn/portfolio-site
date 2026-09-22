<?php
// Local development: copy to apps/geo/config.php.
// Production: add these GEO_* constants to the existing protected site-root config.php.
// The deployment workflow excludes config.php and preserves the server-only file.
// Never commit the real password.
define('GEO_DB_HOST', 'localhost');
define('GEO_DB_NAME', 'cf278796_geo');
define('GEO_DB_USER', 'cf278796_geo');
define('GEO_DB_PASS', 'REPLACE_ON_SERVER');
define('GEO_DB_CHARSET', 'utf8mb4');
