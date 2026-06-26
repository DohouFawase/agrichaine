<?php

namespace App\Repositories\Contracts;

interface OrderRepositoryInterface
{
  public function find(string $id);
  public function getOrdersByRole(string $userId, string $role, bool $inProgressOnly = true);
  public function create(array $orderData, int $buyerId, float $globalCost);
  public function assignDriver(string $orderId, string $driverId);
  public function updateStatus(string $orderId, string $status);
  public function validateDeliveryWithQRCode(string $orderId, string $scannedCode): bool;
}
