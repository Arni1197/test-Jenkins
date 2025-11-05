module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../', // корень проекта (не test)
  testRegex: '.*\\.integration\\.spec\\.ts$', // все файлы с таким суффиксом
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], // чтобы можно было использовать .env
};