<?php

declare(strict_types=1);

namespace HoloScope\Routing;

use Closure;

final readonly class Route
{
    public Closure $handler;

    /** @param callable(array<string, string>): \HoloScope\Http\Response $handler */
    public function __construct(
        public string $method,
        public string $pattern,
        callable $handler,
    ) {
        $this->handler = Closure::fromCallable($handler);
    }
}
