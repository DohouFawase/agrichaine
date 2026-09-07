<?php

namespace Tests\Feature;

use Tests\TestCase;

class TestMomoEndpointTest extends TestCase
{
    public function test_momo_test_endpoint_is_not_exposed(): void
    {
        $this->postJson('/api/test-momo')->assertNotFound();
    }

    public function test_wallet_and_order_momo_endpoints_require_authentication(): void
    {
        $this->postJson('/api/v1/wallet/topup', [
            'phone' => '+22990000000',
            'amount' => 1000,
        ])->assertUnauthorized();

        $this->getJson('/api/v1/wallet/topup/test-reference/status')->assertUnauthorized();
        $this->postJson('/api/v1/wallet/withdraw', [
            'phone' => '+22990000000',
            'amount' => 1000,
        ])->assertUnauthorized();
        $this->getJson('/api/v1/wallet/withdraw/test-reference/status')->assertUnauthorized();
        $this->postJson('/api/v1/orders/pay-with-momo')->assertUnauthorized();
    }
}