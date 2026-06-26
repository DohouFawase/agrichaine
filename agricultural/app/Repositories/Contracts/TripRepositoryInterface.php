<?php

namespace App\Repositories\Contracts;

interface TripRepositoryInterface
{
    public function create(array $data);
    public function getByTransporter(string $transporterId);
    public function find(string $id);
}
