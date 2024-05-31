use darling::{FromDeriveInput, FromMeta};
use proc_macro2::TokenStream;
use quote::quote;
use rename::RenameRule;
use syn::{parse2, Data, DeriveInput, Fields, Meta};

pub mod rename;

#[derive(Debug, FromMeta)]
pub struct SqlxAttribute {
    #[darling(default)]
    pub rename_all: Option<String>,
}

#[derive(Debug, FromDeriveInput)]
#[darling(attributes(muon), forward_attrs(sqlx))]
pub struct MuonicAttributes {
    #[darling(default)]
    pub rename_all: Option<String>,
    pub attrs: Vec<syn::Attribute>,
}

pub fn muonic_entity_derive(input: TokenStream) -> TokenStream {
    let input = match parse2::<DeriveInput>(input) {
        Ok(tree) => tree,
        Err(error) => return error.to_compile_error(),
    };

    let mut sqlx = None;

    for attr in &input.attrs {
        if attr.path().is_ident("sqlx") {
            sqlx = Some(SqlxAttribute::from_meta(&attr.meta).unwrap())
        }
    }

    let rename_rule = RenameRule::new(sqlx.map(|x| x.rename_all).flatten());

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
    let fields_binds = fields.clone();
    let fields_renamed = fields
        .clone()
        .into_iter()
        .map(|field| rename_rule.apply_to_ident(field.as_ref().unwrap()));

    // Construct the output, possibly using quasi-quotation
    let expanded = quote! {
        impl ::muonic::entity::Entity for #name {
            fn _entity_metadata() -> &'static ::muonic::entity::Meta {
                static META: ::muonic::entity::Meta = ::muonic::entity::Meta {
                    table_name: stringify!(#name),
                    primary_key: "id",
                    fields: &[
                        #( ::muonic::entity::MetaField { name: stringify!(#fields_renamed) } ),*
                    ],
                };
                &META
            }

            fn _bind_fields<'a, 'q, O>(
                &'a self,
                query: sqlx::query::QueryAs<'q, ::sqlx::Postgres, O, ::sqlx::postgres::PgArguments>,
            ) -> sqlx::query::QueryAs<'q, ::sqlx::Postgres, O, ::sqlx::postgres::PgArguments> {
                #( let query = query.bind(self.#fields_binds.clone()); )*
                query
            }
        }
    };
    TokenStream::from(expanded)
}
