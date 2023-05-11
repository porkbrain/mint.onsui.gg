// The module name (and witness) is replaced by the symbol the user chooses.
// The symbol buffer is also replaced that that input.
//
// We use placeholders to then find them in JS dynamically and replace them.
module 0x0::aa {
    use std::option;
    use std::ascii;
    use std::vector;
    use std::string::{Self, utf8};
    use sui::url;
    use sui::coin;
    use sui::transfer::{public_transfer, public_share_object};
    use sui::tx_context::{TxContext, sender};

    struct AA has drop {}

    fun init(w: AA, ctx: &mut TxContext) {
        // 12 decimals max
        // each char is one decimal place
        let decimals_buffer = b"RDECIM      ";
        let decimals = vector::length(&trim_right(decimals_buffer));

        // 8 chars max
        let symbol_buffer = b"RSYMBL  ";
        let symbol = ascii::into_bytes(string::to_ascii(utf8(trim_right(symbol_buffer))));

        // 32 chars max
        let name_buffer = b"RNAMEE                          ";
        let name = trim_right(name_buffer);

        // 320 chars max
        let description_buffer = b"RDESCR                                                                                                                                                                                                                                                                                                                          ";
        let description = trim_right(description_buffer);

        // 320 chars max
        let icon_url_buffer = b"RICONU                                                                                                                                                                                                                                                                                                                          ";
        let icon_url = trim_right(icon_url_buffer);
        let icon_url = if (vector::length(&icon_url) == 0) {
            option::none()
        } else {
            option::some(url::new_unsafe_from_bytes(icon_url))
        };

        let (mint_cap, meta) = coin::create_currency(
            w,
            (decimals as u8),
            symbol,
            name,
            description,
            icon_url,
            ctx,
        );

        // the sender can mint, burn and update meta
        public_transfer(mint_cap, sender(ctx));
        // public to allow edits
        public_share_object(meta);
    }

    fun trim_right(buf: vector<u8>): vector<u8> {
        let space_byte_code: &u8 = &32;
        while (vector::length(&buf) > 0) {
            if (vector::borrow(&buf, vector::length(&buf) - 1) != space_byte_code) {
                // stop at first non-space char from right
                break
            };

            vector::pop_back(&mut buf);
        };

        buf
    }
}
