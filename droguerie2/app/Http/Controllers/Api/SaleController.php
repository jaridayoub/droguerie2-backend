<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with('user', 'client', 'items.product.category')->latest();

        if ($request->status) $query->where('status', $request->status);
        if ($request->date)   $query->whereDate('created_at', $request->date);

        $perPage = min((int)($request->per_page ?? 20), 2000);
        return response()->json($query->paginate($perPage));
    }

    public function show(Sale $sale)
    {
        return response()->json($sale->load('user', 'client', 'items.product'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'client_id'      => 'nullable|exists:clients,id',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'remise'         => 'nullable|numeric|min:0',
            'remise_percent' => 'nullable|numeric|min:0|max:100',
            'paid'           => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,credit,mixed',
            'notes'          => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, &$sale) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    abort(422, "Stock insuffisant pour: {$product->name}");
                }

                $lineTotal = $product->price * $item['quantity'];
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'price'        => $product->price,
                    'quantity'     => $item['quantity'],
                    'total'        => $lineTotal,
                    'tva'          => $product->tva ?? 0,

                ];

                // Décrémentation stock
                $product->decrement('stock', $item['quantity']);
            }

            // Calcul remise
            $remisePercent = (float) ($request->remise_percent ?? 0);
            $remise = $remisePercent > 0
                ? round($subtotal * $remisePercent / 100, 2)
                : (float) ($request->remise ?? 0);

            $total  = max(0, $subtotal - $remise);
            $paid   = (float) $request->paid;
            $credit = max(0, $total - $paid);

            $status = $credit > 0 ? 'credit' : 'completed';

            // Si client + crédit → vérifier plafond puis mettre à jour la dette
            if ($credit > 0 && $request->client_id) {
                $client = Client::findOrFail($request->client_id);
                if ($client->credit_limit > 0 && ($client->credit_used + $credit) > $client->credit_limit) {
                    abort(422, "Plafond de crédit dépassé. Disponible: " . number_format($client->credit_limit - $client->credit_used, 2) . " DH");
                }
                $client->increment('credit_used', $credit);
            }

            $sale = Sale::create([
                'invoice_number' => Sale::generateInvoiceNumber(),
                'user_id'        => $request->user()->id,
                'client_id'      => $request->client_id,
                'subtotal'       => $subtotal,
                'remise'         => $remise,
                'remise_percent' => $remisePercent,
                'total'          => $total,
                'paid'           => $paid,
                'credit'         => $credit,
                'payment_method' => $request->payment_method,
                'status'         => $status,
                'notes'          => $request->notes,
            ]);

            $sale->items()->createMany($itemsData);
        });

        return response()->json($sale->load('items', 'client', 'user'), 201);
    }

    public function cancel(Sale $sale)
    {
        $this->authorize('admin');

        if ($sale->status === 'cancelled') {
            return response()->json(['message' => 'Déjà annulé'], 422);
        }

        DB::transaction(function () use ($sale) {
            // Remettre le stock
            foreach ($sale->items as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
            }

            // Remettre le crédit client si applicable
            if ($sale->credit > 0 && $sale->client_id) {
                $sale->client->decrement('credit_used', $sale->credit);
            }

            $sale->update(['status' => 'cancelled']);
        });

        return response()->json(['message' => 'Vente annulée']);
    }

    public function dashboard()
    {
        $today = now()->toDateString();

        return response()->json([
            'today_sales'    => Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->sum('total'),
            'today_count'    => Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->count(),
            'month_sales'    => Sale::whereMonth('created_at', now()->month)->where('status', '!=', 'cancelled')->sum('total'),
            'total_credit'   => Sale::where('status', 'credit')->sum('credit'),
            'low_stock'      => Product::whereColumn('stock', '<=', 'stock_alert')->where('active', true)->count(),
            'recent_sales'   => Sale::with('client', 'user')->latest()->take(5)->get(),
        ]);
    }
}