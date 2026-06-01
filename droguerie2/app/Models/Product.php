<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'barcode', 'image',
        'description', 'price', 'cost_price',
        'stock', 'stock_alert', 'active','tva'
    ];

    protected $casts = ['active' => 'boolean'];

    protected $appends = ['image_url', 'low_stock'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }

    public function getLowStockAttribute(): bool
    {
        return $this->stock <= $this->stock_alert;
    }
}