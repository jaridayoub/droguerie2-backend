<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'     => 'Admin Tassouki',
            'email'    => 'admin@tassouki.ma',
            'password' => Hash::make('admin123456789'),
            'role'     => 'admin',
            'active'   => true,
        ]);

        User::create([
            'name'     => 'Vendeur Test',
            'email'    => 'vendeur@tassouki.ma',
            'password' => Hash::make('vendeur123456789'),
            'role'     => 'vendeur',
            'active'   => true,
        ]);
    }
}