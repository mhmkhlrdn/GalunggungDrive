<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    protected $casts = [
        'value' => 'string',
    ];

    /**
     * Get a setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        return static::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, $value, string $type = 'string', ?string $description = null): void
    {
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => static::prepareValue($value, $type),
                'type' => $type,
                'description' => $description,
            ]
        );
    }

    /**
     * Get multiple settings at once
     */
    public static function getMany(array $keys): array
    {
        $settings = static::whereIn('key', $keys)->get();
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting->key] = static::castValue($setting->value, $setting->type);
        }

        return $result;
    }

    /**
     * Set multiple settings at once
     */
    public static function setMany(array $settings): void
    {
        foreach ($settings as $key => $data) {
            $value = $data['value'] ?? $data;
            $type = $data['type'] ?? 'string';
            $description = $data['description'] ?? null;

            static::set($key, $value, $type, $description);
        }
    }

    /**
     * Cast value based on type
     */
    private static function castValue($value, string $type)
    {
        switch ($type) {
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'integer':
                return (int) $value;
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }

    /**
     * Prepare value for storage based on type
     */
    private static function prepareValue($value, string $type)
    {
        switch ($type) {
            case 'boolean':
                return $value ? '1' : '0';
            case 'json':
                return json_encode($value);
            default:
                return (string) $value;
        }
    }

    /**
     * Check if maintenance mode is enabled
     */
    public static function isMaintenanceMode(): bool
    {
        return static::get('maintenance_mode', false);
    }

    /**
     * Enable maintenance mode
     */
    public static function enableMaintenanceMode(): void
    {
        static::set('maintenance_mode', true, 'boolean', 'Maintenance mode status');
    }

    /**
     * Disable maintenance mode
     */
    public static function disableMaintenanceMode(): void
    {
        static::set('maintenance_mode', false, 'boolean', 'Maintenance mode status');
    }

    /**
     * Get site name
     */
    public static function getSiteName(): string
    {
        return static::get('site_name', config('app.name', 'Laravel'));
    }

    /**
     * Get logo URL
     */
    public static function getLogoUrl(): ?string
    {
        $logo = static::get('logo_filename');
        return $logo ? asset('storage/logos/' . $logo) : null;
    }

    /**
     * Get favicon URL
     */
    public static function getFaviconUrl(): ?string
    {
        $favicon = static::get('favicon_filename');
        return $favicon ? asset('storage/logos/' . $favicon) : null;
    }
}
