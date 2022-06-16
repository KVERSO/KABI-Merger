dfx canister --no-wallet create www

dfx build --network=ic www

dfx canister --network=ic install www --mode=reinstall

dfx canister --network=ic status www 