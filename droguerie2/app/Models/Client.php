<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'name', 'phone', 'email', 'address',
        'credit_limit', 'credit_used'
    ];

    protected $appends = ['balance'];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function creditPayments()
    {
        return $this->hasMany(CreditPayment::class);
    }

    public function getBalanceAttribute(): float
    {
        return (float) $this->credit_used; // montant restant à payer
    }
}