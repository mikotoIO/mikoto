# Project Structure

```
mikoto/
├── apps/                     # Application services
│   ├── client/               # Web client (React)
│   │   ├── public/           # Static assets
│   │   └── src/              # Client source code
│   │       ├── components/   # UI components
│   │       ├── functions/    # Utility functions
│   │       ├── hooks/        # React hooks
│   │       ├── store/        # State management
│   │       ├── ui/           # UI primitives
│   │       └── views/        # Page components
│   ├── content-proxy/        # Content proxy service (Rust)
│   ├── desktop/              # Desktop application (Electron)
│   ├── mobile/               # Mobile application (React Native)
│   └── superego/             # API server (Rust)
│       ├── migrations/       # Database migrations
│       └── src/              # Server source code
│           ├── entities/     # Database entities
│           ├── functions/    # Utility functions
│           ├── middlewares/  # Request middlewares
│           ├── routes/       # API endpoints
│           └── services/     # Business logic
├── data/                     # Data storage directory
└── packages/                 # Shared packages
    ├── mikoto.js/            # JavaScript client library
    ├── mikoto.py/            # Python client library
    ├── lexical-markdown/     # Custom markdown editor based on Lexical
    ├── tsconfig/             # Shared TypeScript configurations
    └── permcheck/            # Permission checking utilities
```
