import crypto from 'crypto';

// Generate a secure random JWT secret
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate and display the secret
const secret = generateJWTSecret();
console.log('\n🔐 Generated JWT Secret (copy this for Railway):');
console.log('='.repeat(80));
console.log(secret);
console.log('='.repeat(80));
console.log('\n✅ Copy the above secret and use it as JWT_SECRET in Railway environment variables');
console.log('⚠️  Keep this secret secure and never commit it to version control!\n');
