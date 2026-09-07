<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;

class ProductRepository implements ProductRepositoryInterface
{
    protected $model;

    public function __construct(Product $model)
    {
        $this->model = $model;
    }

    public function getAvailable(array $filters = [])
    {
        $query = $this->model->with(['producer', 'categoryRelation'])
            ->where('status', 'available')
            ->where('quantity', '>', 0)
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }
        if (!empty($filters['category'])) {
            $query->where(function ($categoryQuery) use ($filters) {
                $categoryQuery->where('category', $filters['category'])
                    ->orWhereHas('categoryRelation', function ($relationQuery) use ($filters) {
                        $relationQuery->where('slug', $filters['category'])
                            ->orWhere('id', $filters['category']);
                    });
            });
        }
        if (!empty($filters['location'])) {
            $query->where('location', 'like', '%' . $filters['location'] . '%');
        }
        if (isset($filters['min_price'])) {
            $query->where('price_per_unit', '>=', $filters['min_price']);
        }
        if (isset($filters['max_price'])) {
            $query->where('price_per_unit', '<=', $filters['max_price']);
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }
    public function getByProducer(string $producerId)
    {
        return $this->model->with('producer')
            ->where('producer_id', $producerId)
            ->latest()
            ->get();
    }
    public function find(string $id)
    {
        return $this->model->with(['producer', 'categoryRelation'])->findOrFail($id);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data)
    {
        $product = $this->find($id);
        $product->update($data);
        return $product;
    }

    public function delete(string $id)
    {
        $product = $this->find($id);
        $product->delete();

        return $product;
    }

    public function deleteAllByProducer(string $producerId): int
    {
        return $this->model->where('producer_id', $producerId)->delete();
    }

    public function restore(string $id)
    {
        $product = $this->model->withTrashed()->findOrFail($id);
        $product->restore();

        return $product->fresh();
    }
}
