<?php

declare(strict_types=1);

namespace HoloScope\Service;

use HoloScope\Http\Request;

final readonly class AdminAuthService
{
    public function __construct(private string $username, private string $passwordHash)
    {
    }

    public static function fromEnvironment(): self
    {
        return new self((string) getenv('HOLOSCOPE_ADMIN_USER'), (string) getenv('HOLOSCOPE_ADMIN_PASSWORD_HASH'));
    }

    public function configured(): bool
    {
        return $this->username !== '' && $this->passwordHash !== '';
    }

    public function authenticate(Request $request): bool
    {
        if (!$this->configured()) {
            return false;
        }
        $authorization = $request->header('authorization');
        if ($authorization === null || !str_starts_with($authorization, 'Basic ')) {
            return false;
        }
        $decoded = base64_decode(substr($authorization, 6), true);
        if (!is_string($decoded) || !str_contains($decoded, ':')) {
            return false;
        }
        [$username, $password] = explode(':', $decoded, 2);
        return hash_equals($this->username, $username) && password_verify($password, $this->passwordHash);
    }
}
