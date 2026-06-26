<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->role === 'producer';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'min:0.1'],
            'stock_proof_photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:5000',
            'unit' => ['required', 'string', 'max:50'], // ex: sac, kg, panier
            'price_per_unit' => ['required', 'integer', 'min:1'], // Prix en FCFA
            'location' => ['required', 'string', 'max:255'], // Lieu de collecte
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du produit est requis',
            'quantity.required' => 'La quantité est requise',
            'quantity.numeric' => 'La quantité doit être un nombre',
            'quantity.min' => 'La quantité doit être au moins de 0.1',
            'unit.required' => 'L\'unité est requise',
            'unit.string' => 'L\'unité doit être une chaîne de caractères',
            'unit.max' => 'L\'unité ne doit pas dépasser 50 caractères',
            'price_per_unit.required' => 'Le prix par unité est requis',
            'price_per_unit.integer' => 'Le prix par unité doit être un entier',
            'price_per_unit.min' => 'Le prix par unité doit être au moins de 1 FCFA',
            'location.required' => 'Le lieu de collecte est requis',
            'location.string' => 'Le lieu de collecte doit être une chaîne de caractères',
            'location.max' => 'Le lieu de collecte ne doit pas dépasser 255 caractères',
        ];
    }
}
