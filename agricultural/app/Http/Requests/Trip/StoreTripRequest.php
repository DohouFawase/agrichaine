<?php

namespace App\Http\Requests\Trip;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTripRequest extends FormRequest
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
            'departure_city' => ['required', 'string', 'max:100'],
            'destination_city' => ['required', 'string', 'max:100'],
            'available_weight' => ['required', 'integer', 'min:1'], // Capacité en kg ou sacs
            'departure_date' => ['required', 'date', 'after:now'], // Doit être dans le futur
        ];
    }

    public function messages(): array
    {
        return [
            'departure_city.required' => 'La ville de départ est requise',
            'departure_city.string' => 'La ville de départ doit être une chaîne de caractères',
            'departure_city.max' => 'La ville de départ ne doit pas dépasser 100 caractères',
            'destination_city.required' => 'La ville de destination est requise',
            'destination_city.string' => 'La ville de destination doit être une chaîne de caractères',
            'destination_city.max' => 'La ville de destination ne doit pas dépasser 100 caractères',
            'available_weight.required' => 'Le poids disponible est requis',
            'available_weight.integer' => 'Le poids disponible doit être un entier',
            'available_weight.min' => 'Le poids disponible doit être au moins de 1 kg ou sac',
            'departure_date.required' => 'La date de départ est requise',
            'departure_date.date' => 'La date de départ doit être une date valide',
            'departure_date.after' => 'La date de départ doit être dans le futur',
        ];
    }
}
