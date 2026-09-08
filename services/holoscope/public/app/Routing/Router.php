<?php

declare(strict_types=1);

namespace HoloScope\Routing;

final class Router
{
    /** @var list<Route> */
    private array $routes = [];

    /** @param callable(array<string, string>): \HoloScope\Http\Response $handler */
    public function get(string $pattern, callable $handler): self
    {
        $this->routes[] = new Route('GET', $pattern, $handler);
        return $this;
    }

    public function match(string $method, string $path): ?RouteMatch
    {
        foreach ($this->routes as $route) {
            if ($route->method !== strtoupper($method)) {
                continue;
            }
            $regex = $this->compile($route->pattern);
            if (preg_match($regex, $path, $matches) !== 1) {
                continue;
            }
            $parameters = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $parameters[$key] = $value;
                }
            }
            return new RouteMatch($route, $parameters);
        }
        return null;
    }

    private function compile(string $pattern): string
    {
        $escaped = preg_quote($pattern, '~');
        $escaped = preg_replace(
            '/\\\{([a-zA-Z][a-zA-Z0-9_]*)\\\}/',
            '(?P<$1>[a-z0-9]+(?:-[a-z0-9]+)*)',
            $escaped,
        );
        return '~^' . $escaped . '$~D';
    }
}
