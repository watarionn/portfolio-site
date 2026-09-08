<?php

declare(strict_types=1);

use HoloScope\Application;
use HoloScope\Config\AppConfig;
use HoloScope\Http\Request;

require __DIR__ . '/app/bootstrap.php';

$config = AppConfig::fromEnvironment(__DIR__);
$application = Application::create($config);
$application->handle(Request::fromGlobals())->send();
