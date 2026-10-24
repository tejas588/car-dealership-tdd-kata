export function assertSafeTestDatabase(developmentUrl, testUrl) {
  const errorMessage =
    'Separate car_dealership and car_dealership_test databases are required';
  if (!developmentUrl || !testUrl || developmentUrl === testUrl) {
    throw new Error(errorMessage);
  }

  try {
    const developmentName = new URL(developmentUrl).pathname.slice(1);
    const testName = new URL(testUrl).pathname.slice(1);
    if (
      developmentName !== 'car_dealership' ||
      testName !== 'car_dealership_test'
    ) {
      throw new Error(errorMessage);
    }
  } catch {
    throw new Error(errorMessage);
  }
}
