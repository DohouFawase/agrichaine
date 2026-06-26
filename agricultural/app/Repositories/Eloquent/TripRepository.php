<?php

namespace App\Repositories\Eloquent;

use App\Models\Trip;
use App\Repositories\Contracts\TripRepositoryInterface;

class TripRepository implements TripRepositoryInterface
{
    protected $model;

    public function __construct(Trip $model)
    {
        $this->model = $model;
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function getByTransporter(string $transporterId)
    {
        return $this->model->where('transporter_id', $transporterId)
            ->latest()
            ->get();
    }

    public function find(string $id)
    {
        return $this->model->findOrFail($id);
    }
}
