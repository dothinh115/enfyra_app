# Enfyra CMS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Nuxt](https://img.shields.io/badge/Nuxt-3-green.svg)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

A modern, extensible headless CMS built with Nuxt 3, featuring dynamic table management, extension system, API composables with automatic error handling, and a responsive Vue.js interface.

## Features

- **Dynamic Table Management** - Create and modify database tables on the fly
- **Built-in API Composables** - `useApi` and `useApiLazy` with automatic error handling
- **Toast Notifications** - Automatic error notifications with context
- **TypeScript Support** - Full type safety throughout the application
- **Extension System** - Extensible architecture with dynamic extension loading
- **Responsive Design** - Mobile-friendly interface
- **Authentication System** - Built-in user authentication and roles
- **Permission System** - Comprehensive role-based access control (RBAC)
- **Menu Registry** - Dynamic sidebar and menu management
- **Header Actions** - Configurable header button system

## Documentation

For detailed usage instructions, see:

### Architecture & Structure
- [Project Structure](./docs/project-structure.md) - Complete project structure and architecture overview
- [API Composables Guide](./docs/api-composables.md) - Complete guide with examples and patterns
- [FilterQuery Composable](./docs/FilterQuery.md) - Building and managing data filters
- [FormField System](./docs/FormField.md) - Dynamic form generation, validation, and error handling

### Systems & Features
- [Permission System](./docs/permission-system.md) - Comprehensive guide to the RBAC permission system
- [Permission System Quick Reference](./docs/permission-system-quick-reference.md) - Quick reference for common permission patterns
- [Header Action Registry](./docs/header-action-registry.md) - Dynamic header actions and button management system
- [Menu Registry](./docs/menu-registry.md) - Dynamic menu system for sidebar navigation

### Development
- [Plugin Development Guide (Vietnamese)](./docs/plugin-development-guide-vi.md) - Extension development guide

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

## Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/enfyra-cms.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/amazing-feature`
5. Make your changes and commit: `git commit -m 'Add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Issues](https://github.com/dothinh115/dynamiq_cms/issues)
- 💬 [Discussions](https://github.com/dothinh115/dynamiq_cms/discussions)

## Credits

Built with ❤️ using:

- [Nuxt.js](https://nuxt.com/) - The Vue.js Framework
- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Nuxt UI](https://ui.nuxt.com/) - UI Components
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
