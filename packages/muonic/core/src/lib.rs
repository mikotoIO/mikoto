use proc_macro2::TokenStream;
use syn::{parse2, Data, DeriveInput, Field, Fields, Visibility};

pub struct MuonicEntity {
    pub name: String,
    pub fields: Vec<MuonicField>,
}

impl MuonicEntity {
    pub fn parse(input: &DeriveInput) -> Self {
        let Data::Struct(data) = &input.data else {
            panic!("Entity derive only works on structs");
        };
        let Fields::Named(fields) = &data.fields else {
            panic!("Entity derive only works on named structs");
        };

        let fields: Vec<_> = fields.named.iter().map(MuonicField::parse).collect();

        Self {
            name: input.ident.to_string(),
            fields,
        }
    }
}

pub struct MuonicField {
    pub name: String,
}

impl MuonicField {
    pub fn parse(field: &Field) -> Self {
        MuonicField {
            name: field.ident.as_ref().unwrap().to_string(),
        }
    }
}

pub fn entity_derive_core(tokens: TokenStream) -> TokenStream {
    let input = match parse2::<DeriveInput>(tokens) {
        Ok(tree) => tree,
        Err(error) => return error.to_compile_error(),
    };
    MuonicEntity::parse(&input);

    todo!()
}
