<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'active'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = ['active' => 'boolean'];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}