<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->role === 'buyer';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
       return [
            'product_id' => ['required', 'uuid', 'exists:products,id'], // Vérifie que l'UUID du produit existe
            'quantity_ordered' => ['required', 'numeric', 'min:0.1'],
            'payment_reference' => ['required', 'string', 'unique:transactions,payment_reference'], // Réf de paiement MoMo unique
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'L\'ID du produit est requis',
            'product_id.uuid' => 'L\'ID du produit doit être un UUID valide',
            'product_id.exists' => 'Le produit sélectionné n\'existe pas',
            'quantity_ordered.required' => 'La quantité commandée est requise',
            'quantity_ordered.numeric' => 'La quantité commandée doit être un nombre',
            'quantity_ordered.min' => 'La quantité commandée doit être au moins de 0.1',
            'payment_reference.required' => 'La référence de paiement est requise',
            'payment_reference.string' => 'La référence de paiement doit être une chaîne de caractères',
            'payment_reference.unique' => 'La référence de paiement est déjà utilisée',
        ];
    }
}
