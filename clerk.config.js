/** @type {import('@clerk/clerk-sdk-node').ClerkConfig} */
module.exports = {
  jwt: {
    templates: {
      supabase: {
        claims: {
          sub: '{{user.id}}',
          email: '{{user.primary_email_address}}',
          role: 'authenticated',
        },
        // Add any additional claims that Supabase expects
        // You can customize this based on your Supabase JWT settings
      },
    },
  },
}; 