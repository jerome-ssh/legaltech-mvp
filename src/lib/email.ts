import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.SENDGRID_FROM_EMAIL!
}: EmailOptions) {
  try {
    const msg = {
      to,
      from,
      subject,
      html,
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Email templates
export const emailTemplates = {
  caseUpdate: (caseTitle: string, message: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Case Update: ${caseTitle}</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        ${message}
      </div>
      <p style="color: #7f8c8d; font-size: 12px;">
        This is an automated message from your legal case management system.
      </p>
    </div>
  `,
  
  meetingInvite: (caseTitle: string, meetingDetails: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Meeting Invitation: ${caseTitle}</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${meetingDetails.date}</p>
        <p><strong>Time:</strong> ${meetingDetails.time}</p>
        <p><strong>Location:</strong> ${meetingDetails.location}</p>
        <p><strong>Description:</strong> ${meetingDetails.description}</p>
      </div>
      <p style="color: #7f8c8d; font-size: 12px;">
        Please respond to this email to confirm your attendance.
      </p>
    </div>
  `,
  
  documentNotification: (caseTitle: string, documentName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">New Document: ${caseTitle}</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p>A new document has been uploaded to your case:</p>
        <p><strong>Document Name:</strong> ${documentName}</p>
      </div>
      <p style="color: #7f8c8d; font-size: 12px;">
        Please log in to your account to view the document.
      </p>
    </div>
  `
}; 