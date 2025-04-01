export default {
    transform: {
      '^.+\\.js$': 'babel-jest', // Użyj babel-jest do transformacji plików .js
    },
    testEnvironment: 'node', // Ustaw środowisko testowe na Node.js
  };