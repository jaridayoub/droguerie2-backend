<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category')->where('active', true);

        // Recherche rapide POS
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('barcode', 'like', "%{$request->search}%");
            });
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->get());
    }

    public function lowStock()
    {
        $products = Product::with('category')
            ->whereColumn('stock', '<=', 'stock_alert')
            ->where('active', true)
            ->get();
        return response()->json($products);
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name'        => 'required|string|max:255',
            'barcode'     => 'nullable|string|unique:products',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'cost_price'  => 'nullable|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'stock_alert' => 'nullable|integer|min:0',
            'image'       => 'nullable|image|max:2048',
            'active'      => 'boolean',
            'tva' => 'nullable|numeric|min:0|max:100',

        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);
        return response()->json($product->load('category'), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load('category'));
    }

    public function update(Request $request, Product $product)
    {
        $this->authorize('admin');

        $data = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name'        => 'sometimes|string|max:255',
            'barcode'     => 'nullable|string|unique:products,barcode,' . $product->id,
            'description' => 'nullable|string',
            'price'       => 'sometimes|numeric|min:0',
            'cost_price'  => 'nullable|numeric|min:0',
            'stock'       => 'sometimes|integer|min:0',
            'stock_alert' => 'nullable|integer|min:0',
            'image'       => 'nullable|image|max:2048',
            'active'      => 'boolean',
            'tva'         => 'nullable|numeric|min:0|max:100',  // ← zid had s-satr

        ]);

        if ($request->hasFile('image')) {
            if ($product->image) Storage::disk('public')->delete($product->image);
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);
        return response()->json($product->load('category'));
    }

    public function destroy(Product $product)
    {
        $this->authorize('admin');
        if ($product->image) Storage::disk('public')->delete($product->image);
        $product->delete();
        return response()->json(['message' => 'Produit supprimé']);
    }
}