<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'unique:users,phone', 'max:20'],
            'role' => ['required', 'in:producer,transporter,buyer'],
            'password' => ['required', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est requis',
            'last_name.required' => 'Le nom de famille est requis',
            'phone.required' => 'Le numero de telephone est requis',
            'phone.unique' => 'Le numero de telephone est deja utilise',
            'role.required' => 'Le role est requis',
            'role.in' => 'Le role doit etre soit "producer", "transporter" ou "buyer"',
            'password.required' => 'Le mot de passe est requis',
            'password.min' => 'Le mot de passe doit contenir au moins 6 caracteres',
        ];
    }


    
}
