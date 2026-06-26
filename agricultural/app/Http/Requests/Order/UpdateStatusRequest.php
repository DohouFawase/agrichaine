<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
       return [
            'status' => [
                'required', 
                'in:collected,delivered,disputed' // Les statuts modifiables après assignation du chauffeur
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Le statut est requis',
            'status.in' => 'Le statut doit être soit "collected", "delivered" ou "disputed"',
        ];
    }
}
