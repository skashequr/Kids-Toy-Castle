# Email and WhatsApp marketing

The marketing studio is at `/admin/email`. Email drafts and WhatsApp campaign history are stored in MongoDB. Email sending remains disabled because this project has no email provider integration. Previous illustrative campaign statistics were removed.

## WhatsApp setup

Set these server-only environment variables in `.env.local` or your deployment environment, then restart the server:

```dotenv
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_access_token
WHATSAPP_PHONE_NUMBER_ID=your_business_phone_number_id
WHATSAPP_GRAPH_VERSION=v25.0
```

Use a Graph API version supported by your Meta app. Never expose the token through a `NEXT_PUBLIC_` variable. Configure a WhatsApp Business account, business phone number, and token with messaging permissions in Meta.

1. Create and obtain approval for a text-only marketing template in WhatsApp Manager. This implementation supports templates without headers or buttons and optional positional text variables in the body.
2. In the WhatsApp Audience tab, add international phone numbers (for example `+8801712345678`) and record the contact's agreement to marketing messages. Existing newsletter subscribers and customer phone numbers are not automatically opted in.
3. Create a campaign using the exact approved template name and language code. Enter one body variable value per line in template order. Internal notes and the campaign name are not sent to recipients.
4. Select up to 25 active contacts and send. Test with an opted-in number you control before a production campaign.

A campaign is atomically claimed before sending to prevent duplicate submissions. Each provider response is saved, including its message ID or failure information. `submitted` means the provider accepted the requests, not that recipients received or read them. `partial` indicates a mixture of accepted and failed/unconfirmed responses. A network timeout may occur after Meta accepts a message; check Meta before manually creating a replacement campaign.

Sending currently runs synchronously in the server action (up to 10 seconds per recipient). Configure the hosting request duration accordingly; larger audiences require a durable queue/worker. If execution is interrupted, history may remain `sending`; inspect the stored per-recipient results and Meta before proceeding. There is no automatic retry, scheduling, delivery/read webhook, or incoming opt-out webhook. Process opt-out requests using Unsubscribe in the Audience tab. To re-enroll a contact, use Add contact after obtaining fresh consent.

Official payload reference: https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text
