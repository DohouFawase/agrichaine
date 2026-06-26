<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AssignDriverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
       return $this->user()->role === 'transporter';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'order_id.required' => 'L\'ID de la commande est requis',
            'order_id.uuid' => 'L\'ID de la commande doit être un UUID valide',
            'order_id.exists' => 'La commande sélectionnée n\'existe pas',
        ];
    }
}
