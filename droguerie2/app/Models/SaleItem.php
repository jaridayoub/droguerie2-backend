<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id', 'product_id', 'product_name',
        'price', 'quantity', 'total','tva' 
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}