use muonic_core::muonic_entity_derive;
use proc_macro::TokenStream;
use proc_macro_error::proc_macro_error;

#[proc_macro_error]
#[proc_macro_derive(Entity, attributes(entity))]
pub fn entity_derive(tokens: TokenStream) -> TokenStream {
    muonic_entity_derive(tokens.into()).into()
}
