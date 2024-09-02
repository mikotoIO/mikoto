use aide::axum::ApiRouter;

pub fn router() -> ApiRouter {
    ApiRouter::<()>::new()
}
