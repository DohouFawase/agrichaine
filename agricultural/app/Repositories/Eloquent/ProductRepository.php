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

    public function getAvailable()
    {
        // Récupère uniquement les produits disponibles avec les infos du producteur (Eager loading)
        return $this->model->with('producer')
            ->where('status', 'available')
            ->where('quantity', '>', 0)
            ->latest()
            ->get();
    }

    public function find(string $id)
    {
        return $this->model->with('producer')->findOrFail($id);
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
}



