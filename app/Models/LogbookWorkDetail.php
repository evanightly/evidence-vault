<?php

namespace App\Models;

use App\Models\Logbook;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogbookWorkDetail extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'description',
        'logbook_id',
    ];

    public function logbook(): BelongsTo
    {
        return $this->belongsTo(Logbook::class);
    }
}
