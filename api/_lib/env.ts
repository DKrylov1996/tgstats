export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name}_missing`);
  }
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function readPasswordConfig(): { viewPassword: string; editorPassword: string } {
  const viewPassword = requiredEnv('VIEW_PASSWORD');
  const editorPassword = requiredEnv('EDITOR_PASSWORD');

  if (viewPassword === editorPassword) {
    throw new Error('passwords_must_be_different');
  }

  return { viewPassword, editorPassword };
}
