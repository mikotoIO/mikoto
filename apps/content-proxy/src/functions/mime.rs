pub fn get_content_type(path: &str) -> mime::Mime {
    let mime = mime_guess::from_path(path)
        .first()
        .unwrap_or(mime::APPLICATION_OCTET_STREAM);

    mime
}
