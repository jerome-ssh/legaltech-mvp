import { socialProofData } from '@/lib/onboarding-utils';

interface WelcomeEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  firmName: string;
  specialization: string;
  yearsOfPractice: string;
}

export function WelcomeEmail({
  firstName,
  lastName,
  email,
  firmName,
  specialization,
  yearsOfPractice,
}: WelcomeEmailProps) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to LegalTech</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .profile-details {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .profile-details ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .profile-details li {
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            text-align: center;
          }
          .stat-item {
            flex: 1;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .stat-label {
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to LegalTech, ${firstName}! 🎉</h1>
        </div>
        
        <div class="content">
          <p>We're thrilled to have you join our community of ${socialProofData.totalAttorneys.toLocaleString()} legal professionals.</p>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${socialProofData.activeFirms.toLocaleString()}</div>
              <div class="stat-label">Active Firms</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${socialProofData.averageRating}</div>
              <div class="stat-label">Average Rating</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${socialProofData.recentSignups}</div>
              <div class="stat-label">New Members This Week</div>
            </div>
          </div>
          
          <div class="profile-details">
            <h2 style="color: #1e40af; margin-top: 0;">Your Profile Details</h2>
            <ul>
              <li><strong>Name:</strong> ${firstName} ${lastName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Firm:</strong> ${firmName}</li>
              <li><strong>Specialization:</strong> ${specialization}</li>
              <li><strong>Years of Practice:</strong> ${yearsOfPractice}</li>
            </ul>
          </div>

          <h2 style="color: #1e40af;">Getting Started</h2>
          <ol>
            <li>Complete your profile to unlock all features</li>
            <li>Connect with other legal professionals</li>
            <li>Explore our case management tools</li>
            <li>Set up your billing preferences</li>
          </ol>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
              Go to Dashboard
            </a>
          </div>
        </div>

        <div class="footer">
          <p>If you have any questions, our support team is here to help at support@resend.dev</p>
          <p>© ${new Date().getFullYear()} LegalTech. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
} 