<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogbookEvidence extends Model {
    use HasFactory;

    protected $table = 'logbook_evidences';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'filepath',
        'logbook_id',
    ];

    public function logbook(): BelongsTo {
        return $this->belongsTo(Logbook::class);
    }
}
