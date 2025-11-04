<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialMediaEvidence extends Model {
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'social_media_evidences';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'filepath',
        'user_id',
    ];

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}
