use proc_macro2::TokenStream;
use quote::quote;
use syn::{parse2, Data, DeriveInput, Fields};

pub fn muonic_entity_derive(input: TokenStream) -> TokenStream {
    let input = match parse2::<DeriveInput>(input) {
        Ok(tree) => tree,
        Err(error) => return error.to_compile_error(),
    };

    // Used in the quasi-quotation below as `#name`
    let name = &input.ident;
    let fields = match &input.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => {
                return syn::Error::new_spanned(&input.ident, "Expected a struct with named fields")
                    .to_compile_error()
            }
        },
        _ => return syn::Error::new_spanned(&input.ident, "Expected a struct").to_compile_error(),
    };
    let fields = fields.iter().map(|field| &field.ident);
    let fields2 = fields.clone();
    let fields3 = fields.clone();

    // Construct the output, possibly using quasi-quotation
    let expanded = quote! {
        impl ::muonic::entity::Entity for #name {
            fn _entity_metadata() -> &'static ::muonic::entity::Meta {
                static META: ::muonic::entity::Meta = ::muonic::entity::Meta {
                    table_name: stringify!(#name),
                    primary_key: "id",
                    fields: &[
                        #( ::muonic::entity::MetaField { name: stringify!(#fields) } ),*
                    ],
                };
                &META
            }

            fn _bind_fields<'a, 'q, O>(
                &'a self,
                query: sqlx::query::QueryAs<'q, ::sqlx::Postgres, O, ::sqlx::postgres::PgArguments>,
            ) -> sqlx::query::QueryAs<'q, ::sqlx::Postgres, O, ::sqlx::postgres::PgArguments> {
                #( let query = query.bind(self.#fields2.clone()); )*
                query
            }

            fn _bind_fields_partial<'a, 'q, 's, O>(
                &'a self,
                query: sqlx::query::QueryAs<'q, ::sqlx::Postgres, O, ::sqlx::postgres::PgArguments>,
                fields: Vec<&'s str>,
            ) -> sqlx::query::QueryAs<'q, ::sqlx::Postgres, O, ::sqlx::postgres::PgArguments> {
                // use a loop!
                let mut query = query;
                for field in fields {
                    match field {
                        #( stringify!(#fields3) => query = query.bind(self.#fields3.clone()), )*
                        _ => {}
                    }
                }
                query
            }
        }
    };
    TokenStream::from(expanded)
}
