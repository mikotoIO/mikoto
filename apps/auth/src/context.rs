use std::sync::Arc;

use crate::prisma;

#[derive(Clone)]
pub struct Context {
    pub prisma: Arc<prisma::PrismaClient>,
}

pub type Ctx = rocket::State<Context>;
