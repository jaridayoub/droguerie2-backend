<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\CreditPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();
        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
        }
        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email',
            'address'      => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $client = Client::create($data);
        return response()->json($client, 201);
    }

    public function show(Client $client)
    {
        $client->load([
            'sales' => fn($q) => $q->with('items')->latest()->take(20),
            'creditPayments' => fn($q) => $q->latest()->take(20),
        ]);
        return response()->json($client);
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email',
            'address'      => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);
        $client->update($data);
        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        $this->authorize('admin');
        $client->delete();
        return response()->json(['message' => 'Client supprimé']);
    }

    // Enregistrer un paiement de crédit (remboursement)
    public function payCredit(Request $request, Client $client)
    {
        $data = $request->validate([
            'amount'  => 'required|numeric|min:0.01',
            'sale_id' => 'nullable|exists:sales,id',
            'notes'   => 'nullable|string',
        ]);

        if ($data['amount'] > $client->credit_used) {
            return response()->json(['message' => 'Montant supérieur à la dette'], 422);
        }

        DB::transaction(function () use ($client, $data, $request) {
            CreditPayment::create([
                'client_id' => $client->id,
                'sale_id'   => $data['sale_id'] ?? null,
                'user_id'   => $request->user()->id,
                'amount'    => $data['amount'],
                'notes'     => $data['notes'] ?? null,
            ]);

            $client->decrement('credit_used', $data['amount']);
        });

        return response()->json([
            'message' => 'Paiement enregistré',
            'client'  => $client->fresh(),
        ]);
    }

    // Historique crédit d'un client
    public function creditHistory(Client $client)
    {
        $payments = $client->creditPayments()->with('user', 'sale')->latest()->get();
        $sales    = $client->sales()->where('status', 'credit')->with('items')->latest()->get();

        return response()->json([
            'client'   => $client,
            'payments' => $payments,
            'credits'  => $sales,
        ]);
    }
}  