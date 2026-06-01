<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('sale_items', function (Blueprint $table) {
        $table->decimal('tva', 5, 2)->default(0)->after('total');
    });
}

public function down(): void
{
    Schema::table('sale_items', function (Blueprint $table) {
        $table->dropColumn('tva');
    });
}

};
