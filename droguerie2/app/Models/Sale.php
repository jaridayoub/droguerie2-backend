<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'invoice_number', 'user_id', 'client_id',
        'subtotal', 'remise', 'remise_percent', 'total',
        'paid', 'credit', 'payment_method', 'status', 'notes'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public static function generateInvoiceNumber(): string
    {
        $last = static::latest()->first();
        $num = $last ? ((int) substr($last->invoice_number, 4)) + 1 : 1;
        return 'TSK-' . str_pad($num, 6, '0', STR_PAD_LEFT);
    }
}