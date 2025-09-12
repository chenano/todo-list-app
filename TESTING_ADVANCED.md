# Advanced Testing Guide

This document outlines the comprehensive testing strategy for the advanced features of the Todo List application.

## Testing Architecture

### Test Types

1. **Unit Tests** - Individual component and function testing
2. **Integration Tests** - Feature workflow testing
3. **E2E Tests** - Full user journey testing
4. **Performance Tests** - Load and speed testing
5. **Accessibility Tests** - WCAG compliance testing
6. **Visual Regression Tests** - UI consistency testing
7. **Cross-browser Tests** - Browser compatibility testing

### Test Structure

```
src/
├── __tests__/
│   ├── integration/           # Integration tests
│   ├── accessibility/         # Accessibility tests
│   └── utils/                # Test utilities
├── components/
│   └── **/__tests__/         # Component unit tests
├── hooks/
│   └── __tests__/            # Hook tests
├── lib/
│   └── __tests__/            # Library function tests
└── contexts/
    └── __tests__/            # Context tests

e2e/
├── keyboard-navigation.spec.ts    # Keyboard interaction tests
├── offline-support.spec.ts        # Offline functionality tests
├── visual-regression.spec.ts      # Visual consistency tests
├── performance-benchmarks.spec.ts # Performance tests
├── cross-browser.spec.ts          # Browser compatibility tests
└── accessibility-automation.spec.ts # Automated accessibility tests
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all Jest tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:performance
npm run test:accessibility
npm run test:integration
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test suites
npm run test:e2e:keyboard
npm run test:e2e:offline
npm run test:e2e:visual
npm run test:e2e:performance
npm run test:e2e:cross-browser
npm run test:e2e:accessibility

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### All Tests

```bash
# Run complete test suite
npm run test:all
```

## Test Categories

### 1. Search Functionality Tests

**Unit Tests:**
- `src/lib/__tests__/search.test.ts` - Core search logic
- `src/lib/__tests__/search.performance.test.ts` - Search performance
- `src/components/ui/__tests__/search-bar.test.tsx` - Search UI components

**Integration Tests:**
- Search across tasks and lists
- Real-time search results
- Search filters and sorting

**E2E Tests:**
- Global search keyboard shortcuts (Ctrl+K)
- Search result navigation
- Search performance with large datasets

### 2. Bulk Operations Tests

**Unit Tests:**
- `src/hooks/__tests__/useBulkOperations.test.ts` - Bulk operation hooks
- `src/components/tasks/__tests__/BulkActionBar.test.tsx` - Bulk UI components

**Integration Tests:**
- `src/__tests__/integration/bulk-operations.integration.test.tsx` - Complete bulk workflows
- Multi-selection state management
- Bulk operation progress tracking

**E2E Tests:**
- Keyboard shortcuts for bulk selection (Ctrl+A)
- Bulk complete, delete, and move operations
- Progress indicators for large operations

### 3. Theme System Tests

**Unit Tests:**
- `src/lib/__tests__/theme.test.ts` - Theme utilities
- `src/contexts/__tests__/ThemeContext.test.tsx` - Theme context

**Integration Tests:**
- `src/__tests__/integration/theming.integration.test.tsx` - Theme switching workflows
- System theme detection
- Theme persistence

**Visual Tests:**
- `e2e/visual-regression.spec.ts` - Visual consistency across themes
- Component appearance in light/dark modes
- Theme transition animations

### 4. Keyboard Navigation Tests

**Unit Tests:**
- `src/lib/__tests__/keyboard-utils.test.ts` - Keyboard utilities
- `src/hooks/__tests__/useKeyboardShortcut.test.ts` - Keyboard hooks

**E2E Tests:**
- `e2e/keyboard-navigation.spec.ts` - Complete keyboard navigation
- Global shortcuts (Ctrl+N, Ctrl+K, etc.)
- Form navigation and submission
- Accessibility compliance

### 5. Performance Tests

**Unit Tests:**
- `src/components/tasks/__tests__/VirtualTaskList.performance.test.tsx` - Virtual scrolling
- `src/lib/__tests__/search.performance.test.ts` - Search performance

**E2E Tests:**
- `e2e/performance-benchmarks.spec.ts` - End-to-end performance
- Page load times
- Interaction responsiveness
- Memory usage monitoring

### 6. Offline Support Tests

**Unit Tests:**
- `src/lib/__tests__/offline-storage.test.ts` - Offline storage
- `src/lib/__tests__/sync-manager.test.ts` - Sync management

**Integration Tests:**
- `src/__tests__/integration/offline-online-transitions.test.tsx` - Offline/online transitions
- Operation queuing and synchronization
- Conflict resolution

**E2E Tests:**
- `e2e/offline-support.spec.ts` - Complete offline workflows
- Network simulation
- Data persistence across sessions

### 7. Import/Export Tests

**Unit Tests:**
- `src/lib/__tests__/import.test.ts` - Import functionality
- `src/lib/__tests__/export.test.ts` - Export functionality

**Integration Tests:**
- `src/__tests__/integration/import-export.integration.test.tsx` - Complete workflows
- File format support (JSON, CSV, Markdown)
- Data validation and error handling

### 8. Analytics Tests

**Unit Tests:**
- `src/lib/__tests__/analytics.test.ts` - Analytics calculations
- `src/hooks/__tests__/useAnalytics.test.ts` - Analytics hooks

**Integration Tests:**
- Data aggregation and visualization
- Chart rendering and interactions
- Export functionality

### 9. Accessibility Tests

**Unit Tests:**
- `src/__tests__/accessibility/advanced-features.accessibility.test.tsx` - Component accessibility

**E2E Tests:**
- `e2e/accessibility-automation.spec.ts` - Automated WCAG compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation

### 10. Cross-browser Tests

**E2E Tests:**
- `e2e/cross-browser.spec.ts` - Browser compatibility
- Feature detection and fallbacks
- Responsive design across devices
- Performance across browsers

## Test Data Generation

### Utilities

The `src/__tests__/utils/test-data-generators.ts` file provides utilities for generating test data:

```typescript
// Generate tasks for performance testing
const tasks = generateTasks({
  count: 1000,
  completionRate: 0.3,
  priorityDistribution: { high: 0.2, medium: 0.5, low: 0.3 }
});

// Generate realistic task patterns
const realisticTasks = generateRealisticTasks(500);

// Generate search test data
const searchData = generateSearchTestData();

// Generate accessibility test data
const a11yData = generateAccessibilityTestData();
```

### Performance Test Datasets

- **Small**: 5 lists, 50 tasks
- **Medium**: 20 lists, 500 tasks
- **Large**: 100 lists, 5,000 tasks
- **Extra Large**: 500 lists, 50,000 tasks

## Performance Benchmarks

### Target Metrics

- **Page Load**: < 3 seconds
- **First Contentful Paint**: < 1.8 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **Interaction Response**: < 100ms
- **Search Performance**: < 100ms for 1000 items
- **Virtual Scrolling**: 60fps for 10,000+ items

### Memory Limits

- **Initial Load**: < 50MB heap usage
- **Large Dataset**: < 200MB heap usage
- **Memory Leaks**: < 50% increase after navigation cycles

## Accessibility Standards

### WCAG Compliance

- **Level AA** compliance for all features
- **Keyboard Navigation** for all interactive elements
- **Screen Reader** compatibility
- **Color Contrast** ratios meeting standards
- **Focus Management** and indicators

### Testing Tools

- **jest-axe** for automated accessibility testing
- **@axe-core/playwright** for E2E accessibility tests
- Manual testing with screen readers

## Visual Regression Testing

### Screenshot Comparison

- **Theme Variations**: Light and dark mode screenshots
- **Responsive Design**: Mobile, tablet, desktop viewports
- **Component States**: Loading, error, success states
- **Animations**: Transition states and hover effects

### Threshold Settings

- **Pixel Difference**: 0.2% threshold for changes
- **Animation Handling**: Disabled for consistent screenshots
- **Cross-browser**: Separate baselines per browser

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      
  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:accessibility
      - run: npm run test:e2e:accessibility
```

### Test Reports

- **Coverage Reports**: Generated in `coverage/` directory
- **E2E Reports**: HTML reports in `playwright-report/`
- **Performance Reports**: JSON output for CI analysis
- **Accessibility Reports**: WCAG violation summaries

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Test Isolation**: Each test should be independent
4. **Mock External Dependencies**: Use mocks for external services
5. **Performance Considerations**: Set appropriate timeouts

### Maintaining Tests

1. **Regular Updates**: Keep tests updated with feature changes
2. **Flaky Test Management**: Identify and fix unstable tests
3. **Test Data Management**: Use generators for consistent data
4. **Documentation**: Keep test documentation current

### Debugging Tests

1. **Debug Mode**: Use `--debug` flag for Playwright tests
2. **Screenshots**: Capture screenshots on failure
3. **Video Recording**: Record test execution for debugging
4. **Console Logs**: Monitor browser console for errors

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout for slow operations
2. **Flaky Tests**: Add proper wait conditions
3. **Memory Issues**: Use test data generators efficiently
4. **Visual Differences**: Update screenshots when UI changes

### Performance Issues

1. **Slow Tests**: Profile and optimize test execution
2. **Memory Leaks**: Monitor heap usage in tests
3. **Large Datasets**: Use pagination in performance tests
4. **Browser Resources**: Limit concurrent test execution

## Future Enhancements

### Planned Improvements

1. **Mutation Testing**: Add mutation testing for test quality
2. **Property-based Testing**: Use property-based testing for edge cases
3. **Load Testing**: Add load testing for concurrent users
4. **Security Testing**: Add security vulnerability testing
5. **Mobile Testing**: Expand mobile device coverage
6. **API Testing**: Add comprehensive API testing

### Monitoring

1. **Test Metrics**: Track test execution times and success rates
2. **Coverage Trends**: Monitor code coverage over time
3. **Performance Regression**: Alert on performance degradation
4. **Accessibility Compliance**: Track accessibility score improvements