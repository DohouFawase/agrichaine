<?php

namespace App\Repositories\Contracts;

interface ProductRepositoryInterface
{
    public function getAvailable();
    public function find(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
}
