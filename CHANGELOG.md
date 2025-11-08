# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Better Notion MCP
- 7 composite mega tools covering 75% of Notion API
- Markdown-first content handling
- Auto-pagination support
- Bulk operations support
- Docker support
- npm package distribution

## [1.0.0] - 2025-11-08

### Added
- Initial public release
- **pages** tool with 6 actions (create, get, update, archive, restore, duplicate)
- **databases** tool with 6 actions (create, get, query, create_page, update_page, delete_page)
- **blocks** tool with 5 actions (get, children, append, update, delete)
- **users** tool with 3 actions (list, get, me)
- **workspace** tool with 2 actions (info, search)
- **comments** tool with 2 actions (list, create)
- **content_convert** utility tool for markdown ↔ blocks conversion
- Comprehensive test suite
- Documentation and examples
- MIT License

[Unreleased]: https://github.com/n24q02m/better-notion-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/n24q02m/better-notion-mcp/releases/tag/v1.0.0
