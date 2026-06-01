<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // vendeur
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('remise', 10, 2)->default(0);       // remise en DH
            $table->decimal('remise_percent', 5, 2)->default(0); // remise en %
            $table->decimal('total', 10, 2);
            $table->decimal('paid', 10, 2)->default(0);          // montant payé
            $table->decimal('credit', 10, 2)->default(0);        // reste à payer (crédit)
            $table->enum('payment_method', ['cash', 'credit', 'mixed'])->default('cash');
            $table->enum('status', ['completed', 'credit', 'cancelled'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};