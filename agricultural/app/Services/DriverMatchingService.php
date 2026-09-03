<?php

namespace App\Services;

use App\Models\DriverProfile;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class DriverMatchingService
{
    private const MAX_PICKUP_DISTANCE_KM = 50;

    public function assignNearestAvailableDriver(Order $order): ?Order
    {
        $latitude = $order->pickup_latitude ?? $order->delivery_latitude;
        $longitude = $order->pickup_longitude ?? $order->delivery_longitude;

        if ($latitude === null || $longitude === null) {
            return null;
        }

        return DB::transaction(function () use ($order, $latitude, $longitude) {
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($lockedOrder->status !== 'paid_searching_driver' || $lockedOrder->transporter_id !== null) {
                return $lockedOrder;
            }

            $candidate = DriverProfile::query()
                ->where('status', 'available')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->whereHas('user', fn ($query) => $query->where('role', 'transporter'))
                ->get()
                ->map(function (DriverProfile $profile) use ($latitude, $longitude) {
                    $profile->pickup_distance_km = $this->distanceInKilometers(
                        (float) $latitude,
                        (float) $longitude,
                        (float) $profile->latitude,
                        (float) $profile->longitude
                    );

                    return $profile;
                })
                ->filter(fn (DriverProfile $profile) => $profile->pickup_distance_km <= self::MAX_PICKUP_DISTANCE_KM)
                ->sortBy('pickup_distance_km')
                ->first();

            if (!$candidate) {
                return null;
            }

            $lockedCandidate = DriverProfile::whereKey($candidate->id)->lockForUpdate()->first();

            if (!$lockedCandidate || $lockedCandidate->status !== 'available') {
                return null;
            }

            $lockedOrder->update([
                'transporter_id' => $lockedCandidate->user_id,
                'status' => 'assigned_to_driver',
            ]);

            $lockedCandidate->update(['status' => 'busy']);

            return $lockedOrder->fresh(['buyer', 'product.producer', 'transporter']);
        });
    }

    private function distanceInKilometers(float $firstLatitude, float $firstLongitude, float $secondLatitude, float $secondLongitude): float
    {
        $earthRadius = 6371;
        $latitudeDelta = deg2rad($secondLatitude - $firstLatitude);
        $longitudeDelta = deg2rad($secondLongitude - $firstLongitude);
        $a = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($firstLatitude)) * cos(deg2rad($secondLatitude))
            * sin($longitudeDelta / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}