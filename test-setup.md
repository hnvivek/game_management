# Test Suite Documentation

## 🧪 Comprehensive Testing for Sports Booking Platform

This document covers the complete testing setup for our multi-vendor sports booking platform.

## 📋 Test Categories

### 1. **API Tests** (`__tests__/api/`)
- **Vendors API**: Onboarding, listing, vendor management
- **Turfs API**: Venue listing, filtering, availability checking  
- **Bookings API**: Booking creation, conflict detection, validation
- **Availability API**: Time slot checking, overlap detection

### 2. **Component Tests** (`__tests__/components/`)
- **TurfBooking Component**: Multi-step booking flow
- **UI Components**: Form validation, user interactions
- **Error Handling**: API errors, validation errors

### 3. **Integration Tests** (`__tests__/integration/`)
- **End-to-End Booking Flow**: Complete user journey
- **Multi-Vendor Workflow**: Vendor isolation, data integrity
- **Error Scenarios**: Edge cases, concurrent bookings

### 4. **Utility Tests** (`__tests__/utils/`)
- **Time Calculations**: Duration, overlap detection
- **Date Utilities**: Validation, business days
- **Helper Functions**: Formatting, validation

## 🚀 Running Tests

### Local Development
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:api           # API tests only
npm run test:components    # Component tests only  
npm run test:integration   # Integration tests only

# Generate coverage report
npm run test:coverage
```

### CI/CD Pipeline
```bash
# Run tests for CI (no watch mode)
npm run test:ci
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- **Multiple Projects**: Separate environments for API, components, integration
- **Test Environments**: Node.js for API, JSDOM for components
- **Coverage**: Comprehensive coverage reporting
- **Path Mapping**: Resolves `@/` imports correctly

### Test Database
- **Isolated Environment**: Uses `test.db` SQLite database
- **Auto Setup/Teardown**: Creates fresh DB for each test run
- **Seed Data**: Consistent test data across all tests
- **Cleanup**: Automatic cleanup between tests

## 📊 Coverage Targets

| Category | Target Coverage | Current |
|----------|----------------|---------|
| API Routes | 95% | ✅ |
| Components | 85% | ✅ |
| Utilities | 90% | ✅ |
| Integration | 80% | ✅ |

## 🛡️ Test Data Security

### Test Isolation
- Each test runs with fresh database
- No shared state between tests
- Consistent seed data

### Mock Data
```typescript
// Example test vendor
{
  id: 'test-vendor',
  name: 'Test Sports Hub',
  location: 'Test City',
  // ... full vendor object
}

// Example test booking
{
  turfId: 'test-turf-1',
  date: '2025-12-01',
  startTime: '14:00',
  duration: 2,
  totalAmount: 4000
}
```

## 🧩 Test Utilities

### Global Test Helpers (`jest.setup.api.js`)
```typescript
global.testUtils = {
  cleanDatabase(),        // Clear test data
  createTestBooking(),   // Create test booking
  getTomorrowDate(),     // Get future date
  getNextWeekDate()      // Get week ahead date
}
```

### API Test Helpers
```typescript
// Test authenticated requests
await testAuthenticatedRequest('/api/vendors', 'vendor_admin')

// Test time slot conflicts
await testTimeSlotConflict('14:00', '16:00', existingBooking)
```

## 🎯 Testing Best Practices

### 1. **Test Structure**
```typescript
describe('Feature Name', () => {
  beforeEach(async () => {
    await global.testUtils.cleanDatabase()
  })

  describe('Specific Function', () => {
    it('should handle success case', async () => {
      // Arrange
      const testData = { ... }
      
      // Act
      const result = await apiCall(testData)
      
      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toMatchObject(expectedShape)
    })

    it('should handle error case', async () => {
      // Test error scenarios
    })
  })
})
```

### 2. **API Testing**
- ✅ Test success paths
- ✅ Test validation errors (400)
- ✅ Test not found errors (404) 
- ✅ Test conflict errors (409)
- ✅ Test server errors (500)

### 3. **Component Testing**
- ✅ Test user interactions
- ✅ Test form validation
- ✅ Test loading states
- ✅ Test error states
- ✅ Test data display

### 4. **Integration Testing**
- ✅ Test complete workflows
- ✅ Test data persistence
- ✅ Test cross-component communication
- ✅ Test error propagation

## 🔍 Debugging Tests

### Common Issues

#### 1. **Database Connection**
```bash
# If tests fail with DB errors:
rm -f test.db
npm run db:generate
npm test
```

#### 2. **Async/Await Issues**
```typescript
// Always await async operations
await expect(asyncFunction()).resolves.toBe(expectedValue)

// Use waitFor for UI updates
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

#### 3. **Mock Issues**
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

### Test Debugging Tools
```bash
# Run single test file
npm test turfs.test.ts

# Run tests with verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="should create booking"
```

## 📈 Continuous Improvement

### Adding New Tests
1. **New API Route**: Add to appropriate `__tests__/api/` file
2. **New Component**: Create `__tests__/components/ComponentName.test.tsx`
3. **New Integration**: Add to `__tests__/integration/` 
4. **New Utility**: Add to `__tests__/utils/`

### Test Maintenance
- ✅ Update tests when APIs change
- ✅ Maintain mock data consistency
- ✅ Review coverage reports regularly
- ✅ Refactor duplicate test code

### Performance Monitoring
- ✅ Track test execution time
- ✅ Optimize slow tests
- ✅ Parallel test execution
- ✅ Database optimization for tests

## 🚨 Test Alerts

### GitHub Actions
- ✅ Tests run on every push/PR
- ✅ Coverage reports generated
- ✅ Build verification
- ✅ Security audits

### Local Pre-commit
```bash
# Run before committing
npm run test:ci && npm run lint
```

## 🔗 Related Documentation
- [API Documentation](./README.md)
- [Database Schema](./prisma/schema.prisma)
- [Component Library](./src/components/)
- [Deployment Guide](./deployment.md)

---

**🎯 Remember**: Good tests catch bugs before customers do!
