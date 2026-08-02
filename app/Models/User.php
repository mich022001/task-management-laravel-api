<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->uuid ??= (string) Str::uuid();
        });
    }

    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Teams created by the user.
     */
    public function createdTeams(): HasMany
    {
        return $this->hasMany(Team::class, 'created_by');
    }

    /**
     * Teams the user belongs to.
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->withPivot('member_role')
            ->withTimestamps();
    }

    /**
     * Tasks created by the user.
     */
    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * Tasks assigned to the user.
     */
    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    /**
     * Task status history records created by the user.
     */
    public function taskStatusHistories(): HasMany
    {
        return $this->hasMany(TaskStatusHistory::class, 'changed_by');
    }

    /**
     * Comments written by the user on tasks.
     */
    public function taskComments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    /**
     * Private task activity records performed by the user.
     */
    public function taskActivityLogs(): HasMany
    {
        return $this->hasMany(TaskActivityLog::class, 'actor_id');
    }

    /**
     * Use the UUID when resolving users from public routes.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Use the UUID when Laravel resolves an authenticated user.
     */
    public function getAuthIdentifierName(): string
    {
        return 'uuid';
    }

    /**
     * Store the public UUID in the JWT subject claim.
     */
    public function getJWTIdentifier(): mixed
    {
        return $this->uuid;
    }

    /**
     * Return custom JWT claims.
     *
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [
            'email' => $this->email,
            'role' => $this->role,
            'is_active' => $this->is_active,
        ];
    }
}
