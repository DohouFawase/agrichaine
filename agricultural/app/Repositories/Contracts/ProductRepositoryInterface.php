<?php

namespace App\Repositories\Contracts;

interface ProductRepositoryInterface
{
    public function getAvailable(array $filters = []);
    public function find(string $id);
    public function create(array $data);
    public function update(string $id, array $data);
    public function delete(string $id);
    public function deleteAllByProducer(string $producerId): int;
    public function restore(string $id);
}
