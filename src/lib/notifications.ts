import { sendEmail, emailTemplates } from './email';
import { sendSMS, smsTemplates } from './sms';
import { sendSlackMessage, slackTemplates } from './slack';
import { getPreferredTerminology } from './utils';

interface User {
  email?: string;
  phoneNumber?: string;
  slackId?: string;
}

interface NotificationOptions {
  user: User;
  userId: string;
  caseTitle: string;
  message: string;
  type: 'caseUpdate' | 'meetingInvite' | 'documentNotification';
  meetingDetails?: any;
  documentName?: string;
}

interface NotificationResult {
  success: boolean;
  error: Error | null;
}

interface NotificationResults {
  email: NotificationResult;
  sms: NotificationResult;
  slack: NotificationResult;
}

export async function sendNotification({
  user,
  userId,
  caseTitle,
  message,
  type,
  meetingDetails,
  documentName
}: NotificationOptions): Promise<NotificationResults> {
  const results: NotificationResults = {
    email: { success: false, error: null },
    sms: { success: false, error: null },
    slack: { success: false, error: null }
  };

  // Fetch user's preferred terminology
  const terminology = await getPreferredTerminology(userId);
  const label = terminology === 'case' ? 'Case' : 'Matter';

  // Send email if user has email
  if (user.email) {
    let html;
    let subject;
    switch (type) {
      case 'caseUpdate':
        html = emailTemplates.matterUpdate(caseTitle, message, label);
        subject = `${label} Update: ${caseTitle}`;
        break;
      case 'meetingInvite':
        html = emailTemplates.meetingInvite(caseTitle, meetingDetails!, label);
        subject = `Meeting Invitation: ${caseTitle}`;
        break;
      case 'documentNotification':
        html = emailTemplates.documentNotification(caseTitle, documentName!, label);
        subject = `New Document: ${caseTitle}`;
        break;
    }
    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html
    });
    results.email = {
      success: emailResult.success,
      error: emailResult.error as Error | null
    };
  }

  // Send SMS if user has phone number
  if (user.phoneNumber) {
    let smsBody;
    switch (type) {
      case 'caseUpdate':
        smsBody = smsTemplates.matterUpdate(caseTitle, message, label);
        break;
      case 'meetingInvite':
        smsBody = smsTemplates.meetingReminder(caseTitle, meetingDetails!.time, label);
        break;
      case 'documentNotification':
        smsBody = smsTemplates.documentNotification(caseTitle, documentName!, label);
        break;
    }
    const smsResult = await sendSMS({
      to: user.phoneNumber,
      body: smsBody
    });
    results.sms = {
      success: smsResult.success,
      error: smsResult.error as Error | null
    };
  }

  // Send Slack message if user has Slack ID
  if (user.slackId) {
    let blocks;
    let text;
    switch (type) {
      case 'caseUpdate':
        blocks = slackTemplates.matterUpdate(caseTitle, message, label).blocks;
        text = `${label} Update: ${caseTitle}`;
        break;
      case 'meetingInvite':
        blocks = slackTemplates.meetingInvite(caseTitle, meetingDetails!, label).blocks;
        text = `Meeting Invitation: ${caseTitle}`;
        break;
      case 'documentNotification':
        blocks = slackTemplates.documentNotification(caseTitle, documentName!, label).blocks;
        text = `New Document: ${caseTitle}`;
        break;
    }
    const slackResult = await sendSlackMessage({
      channel: user.slackId,
      text,
      blocks
    });
    results.slack = {
      success: slackResult.success,
      error: slackResult.error as Error | null
    };
  }

  return results;
} 