# Enfyra CMS

A headless CMS built with Nuxt 3, featuring dynamic table management, API composables with automatic error handling, and a modern Vue.js interface.

## Features

- **Dynamic Table Management** - Create and modify database tables on the fly
- **Built-in API Composables** - `useApi` and `useApiLazy` with automatic error handling
- **Toast Notifications** - Automatic error notifications with context
- **TypeScript Support** - Full type safety throughout the application
- **Responsive Design** - Mobile-friendly interface
- **Authentication System** - Built-in user authentication and roles


## Documentation

For detailed usage instructions, see:
- [API Composables Guide](./docs/api-composables.md) - Complete guide with examples and patterns
- [FilterQuery Composable](./docs/FilterQuery.md) - Building and managing data filters  
- [FormField System](./docs/FormField.md) - Dynamic form generation, validation, and error handling

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npx nuxi typecheck

# Build for production
npm run build
```
