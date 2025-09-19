module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable some strict rules for faster development
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    '@next/next/no-img-element': 'warn',
    'prefer-const': 'warn'
  }
}
