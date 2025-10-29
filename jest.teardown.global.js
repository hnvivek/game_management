// Global teardown - cleanup after all tests
const { execSync } = require('child_process')

module.exports = async () => {
  console.log('🧹 Global test cleanup...')
  
  try {
    // Remove test database file
    execSync('rm -f ./test.db', { cwd: process.cwd() })
    console.log('✅ Test database file removed')
  } catch (error) {
    // Ignore cleanup errors - file might not exist
    console.log('ℹ️  No test database to cleanup')
  }
}
