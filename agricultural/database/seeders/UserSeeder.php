<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;


class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        User::create([
            'name'      => 'Fabrice',
            'last_name' => 'Dossou',
            'email'     => 'buyer1@test.com',
            'phone'     => '+22990000001',
            'password'  => Hash::make('Password123'),
            'role'      => 'buyer',
            'status'    => 'active',
        ]);

        User::create([
            'name'      => 'Aïcha',
            'last_name' => 'Zannou',
            'email'     => 'buyer2@test.com',
            'phone'     => '+22990000002',
            'password'  => Hash::make('Password123'),

            'role'      => 'buyer',
            'status'    => 'active',
        ]);

        // ── PRODUCTEURS ──────────────────────────────────────────────────────
        User::create([
            'name'      => 'Moussa',
            'last_name' => 'Alassane',
            'email'     => 'producer1@test.com',
            'phone'     => '+22991000001',
            'password'  => Hash::make('Password123'),

            'role'      => 'producer',
            'status'    => 'active',
        ]);

        User::create([
            'name'      => 'Bernadette',
            'last_name' => 'Houngbédji',
            'email'     => 'producer2@test.com',
            'phone'     => '+22991000002',
            'password'  => Hash::make('Password123'),

            'role'      => 'producer',
            'status'    => 'active',
        ]);

        // ── TRANSPORTEURS ────────────────────────────────────────────────────
        User::create([
            'name'      => 'Ismaël',
            'last_name' => 'Toko',
            'email'     => 'transporter1@test.com',
            'phone'     => '+22992000001',
            'password'  => Hash::make('Password123'),

            'role'      => 'transporter',
            'status'    => 'active',
        ]);

        User::create([
            'name'      => 'Rachidatou',
            'last_name' => 'Séro',
            'email'     => 'transporter2@test.com',
            'phone'     => '+22992000002',
            'password'  => Hash::make('Password123'),

            'role'      => 'transporter',
            'status'    => 'active',
        ]);
    }
}
