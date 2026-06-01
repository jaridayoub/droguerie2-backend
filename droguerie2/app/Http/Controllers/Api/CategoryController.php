<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::withCount('products')->get());
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category = Category::create($data);
        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        return response()->json($category->load('products'));
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize('admin');

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($category->image) Storage::disk('public')->delete($category->image);
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);
        return response()->json($category);
    }

   public function destroy(Category $category)
{
    $this->authorize('admin');

    if ($category->products()->count() > 0) {
        return response()->json([
            'message' => "Impossible de supprimer : cette catégorie contient {$category->products()->count()} produit(s). Supprimez ou déplacez les produits d'abord."
        ], 422);
    }

    if ($category->image) Storage::disk('public')->delete($category->image);
    $category->delete();
    return response()->json(['message' => 'Catégorie supprimée']);
}

}