use muonic_core::entity_derive_core;
use proc_macro::TokenStream;
use proc_macro_error::proc_macro_error;

#[proc_macro_error]
#[proc_macro_derive(Entity, attributes(entity))]
pub fn entity_derive(tokens: TokenStream) -> TokenStream {
    entity_derive_core(tokens.into()).into()
}
