<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Internal service authentication
    |--------------------------------------------------------------------------
    |
    | Requests from trusted internal services must provide this value using
    | the X-Service-Key request header.
    |
    */

    'service_key' => env('INTERNAL_SERVICE_KEY'),
];
