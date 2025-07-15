# Contributing to DreamMall NOSTR Client

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github

We use github to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/your-org/nostr-public-client/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/your-org/nostr-public-client/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/nostr-public-client.git
   cd nostr-public-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Code Style

- We use ESLint for JavaScript linting
- We use Prettier for code formatting
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Follow the existing code style

### JavaScript Style Guide

```javascript
// ✅ Good
class NostrService {
    /**
     * Initializes the NOSTR service
     * @param {Object} config - Configuration object
     * @returns {Promise<boolean>} Success status
     */
    async init(config) {
        // Implementation
    }
}

// ❌ Bad
class nostrservice {
    init(c) {
        // Implementation
    }
}
```

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example:
```
feat: add message encryption support

- Implement NIP-04 encryption for direct messages
- Add key derivation utilities
- Update UI to show encryption status
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe what you've changed
   - Reference any related issues
   - Include screenshots for UI changes

## Testing

- Write unit tests for new functions
- Write integration tests for new features
- Ensure all tests pass before submitting PR
- Include edge cases in your tests

```javascript
// Example test
import { KeyService } from '../src/services/KeyService.js';

describe('KeyService', () => {
    test('should generate valid key pair', async () => {
        const service = new KeyService();
        const keyPair = await service.generateKeyPair();
        
        expect(keyPair.publicKey).toBeDefined();
        expect(keyPair.privateKey).toBeDefined();
        expect(keyPair.publicKey.length).toBe(64);
    });
});
```

## Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Include code examples in documentation
- Update CHANGELOG.md

## NOSTR Protocol Guidelines

When contributing NOSTR-related features:

1. **Follow NIPs**: Implement features according to NOSTR Implementation Possibilities
2. **Test with real relays**: Test against actual NOSTR relays
3. **Handle errors gracefully**: NOSTR is decentralized, expect failures
4. **Validate events**: Always validate NOSTR events before processing
5. **Support multiple relays**: Don't rely on a single relay

## Security Considerations

- Never expose private keys in logs
- Validate all user inputs
- Use secure random number generation
- Implement proper error handling
- Follow OWASP security guidelines

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with your question or reach out to the maintainers directly.

Thank you for contributing! 🎉
