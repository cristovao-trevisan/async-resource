module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['tsx', 'ts', 'js', 'jsx'],
  modulePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
}