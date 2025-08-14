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

## 📚 Documentation

### 🏗️ Architecture & Structure
- **[Project Structure](./docs/project-structure.md)** - Complete project structure and architecture overview
- **[API Composables Guide](./docs/api-composables.md)** - Complete guide with examples and patterns  
- **[Filter Query](./docs/filter-query.md)** - Building and managing data filters with usage examples
- **[Form Field System](./docs/form-field.md)** - Dynamic form generation, validation, and error handling

### ⚙️ Systems & Features
- **[Permission System](./docs/permission-system.md)** - Complete usage guide for RBAC with PermissionGate component and usePermissions composable
- **[Header Action Registry](./docs/header-action-registry.md)** - Dynamic header actions and button management system

### 🧩 Components
- **[Settings Card](./docs/settings-card.md)** - Reusable settings card component documentation and usage guide

### 🔧 Development & Extensions
- **[Extension Development Guide](./docs/extension-development-guide.md)** - Complete guide to creating custom extensions with Vue 3, widgets, and API integration

### 📋 Quick Start
For new developers, start with:
1. [Project Structure](./docs/project-structure.md) - Understand the codebase organization
2. [API Composables](./docs/api-composables.md) - Learn data fetching patterns
3. [Permission System](./docs/permission-system.md) - Understand access control
4. [Header Actions](./docs/header-action-registry.md) - Add interactive buttons to pages

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
