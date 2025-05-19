import { WebClient } from '@slack/web-api';

// Initialize Slack client
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

interface SlackMessageOptions {
  channel: string;
  text: string;
  blocks?: any[];
}

export async function sendSlackMessage({ channel, text, blocks }: SlackMessageOptions) {
  try {
    await slackClient.chat.postMessage({
      channel,
      text,
      blocks,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return { success: false, error };
  }
}

// Slack message templates
export const slackTemplates = {
  matterUpdate: (caseTitle: string, message: string, label: string) => ({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${label} Update: ${caseTitle}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }
    ]
  }),
  
  meetingInvite: (caseTitle: string, meetingDetails: any, label: string) => ({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Meeting Invitation: ${caseTitle}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Date:*\n${meetingDetails.date}`
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${meetingDetails.time}`
          },
          {
            type: 'mrkdwn',
            text: `*Location:*\n${meetingDetails.location}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${meetingDetails.description}`
        }
      }
    ]
  }),
  
  documentNotification: (caseTitle: string, documentName: string, label: string) => ({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `New Document: ${caseTitle}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `A new document has been uploaded to your ${label.toLowerCase()}:\n*${documentName}*`
        }
      }
    ]
  })
}; 