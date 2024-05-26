use heck::{ToKebabCase, ToLowerCamelCase, ToShoutySnakeCase, ToSnakeCase, ToUpperCamelCase};

#[derive(Debug)]
pub enum RenameRule {
    Preserve,
    LowerCase,
    SnakeCase,
    UpperCase,
    ScreamingSnakeCase,
    KebabCase,
    CamelCase,
    PascalCase,
}

impl RenameRule {
    pub fn new(rule: Option<String>) -> Self {
        match rule {
            Some(rule) => match rule.as_str() {
                "lowercase" => Self::LowerCase,
                "snake_case" => Self::SnakeCase,
                "UPPERCASE" => Self::UpperCase,
                "SCREAMING_SNAKE_CASE" => Self::ScreamingSnakeCase,
                "kebab-case" => Self::KebabCase,
                "camelCase" => Self::CamelCase,
                "PascalCase" => Self::PascalCase,
                _ => panic!("Invalid rename_all value"),
            },
            None => Self::Preserve,
        }
    }

    pub fn apply(&self, input: &str) -> String {
        match self {
            Self::Preserve => input.to_string(),
            Self::LowerCase => input.to_lowercase(),
            Self::SnakeCase => input.to_snake_case(),
            Self::UpperCase => input.to_uppercase(),
            Self::ScreamingSnakeCase => input.to_shouty_snake_case(),
            Self::KebabCase => input.to_kebab_case(),
            Self::CamelCase => input.to_lower_camel_case(),
            Self::PascalCase => input.to_upper_camel_case(),
        }
    }

    pub fn apply_to_ident(&self, ident: &syn::Ident) -> syn::Ident {
        let renamed = self.apply(&ident.to_string());
        syn::Ident::new(&renamed, ident.span())
    }
}
