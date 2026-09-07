<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'producer';
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'quantity' => ['sometimes', 'numeric', 'min:0.1'],
            'stock_proof_photo' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5000'],
            'unit' => ['sometimes', 'string', 'max:50'],
            'price_per_unit' => ['sometimes', 'integer', 'min:1'],
            'location' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:available,sold_out,expired'],
            'expires_at' => ['sometimes', 'nullable', 'date', 'after:now'],
        ];
    }
}
