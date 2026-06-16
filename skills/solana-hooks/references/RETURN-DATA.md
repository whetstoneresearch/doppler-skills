# Hook Return Data

Hooks communicate decisions through Solana return data.

## CPMM
CPMM expects a fixed decision payload for enabled actions:
- allow or reject
- optional swap fee override
- optional fee split override

Before-actions fail closed when required return data is missing or invalid. After-actions tolerate missing return data.

## Initializer
Initializer hooks can reject swaps and may override swap fee behavior for the current operation.

Missing return data is treated as allow/no change. This makes simple hooks easier to write, but it means hard policy must explicitly return reject data.
