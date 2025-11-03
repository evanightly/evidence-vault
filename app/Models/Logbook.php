<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Logbook extends Model {
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'date',
        'additional_notes',
        'technician_id',
        'work_location_id',
        'shift_id',
        'drive_folder_id',
        'drive_folder_url',
        'drive_published_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'date' => 'date',
            'drive_published_at' => 'datetime',
        ];
    }

    public function technician(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function work_location(): BelongsTo {
        return $this->belongsTo(WorkLocation::class);
    }

    public function shift(): BelongsTo {
        return $this->belongsTo(Shift::class);
    }

    public function work_details(): HasMany {
        return $this->hasMany(LogbookWorkDetail::class);
    }

    public function evidences(): HasMany {
        return $this->hasMany(LogbookEvidence::class);
    }
}
