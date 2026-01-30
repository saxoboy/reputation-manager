import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion: string = 'v18.0';
  private readonly baseUrl: string = 'https://graph.facebook.com';

  constructor(private configService: ConfigService) {
    this.accessToken =
      this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId =
      this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';

    if (!this.accessToken || !this.phoneNumberId) {
      this.logger.warn(
        'WhatsApp credentials not found in environment variables',
      );
    }
  }

  /**
   * Send a template message (required for business-initiated conversations)
   * @param to Phone number in E.164 format (without +) or with +
   * @param templateName Name of the template in WhatsApp Business Manager
   * @param languageCode Language code (e.g. 'es', 'en_US')
   * @param components Template components (header, body parameters, etc.)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'es',
    components: unknown[] = [],
  ): Promise<boolean> {
    const formattedTo = to.replace('+', '');
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to: formattedTo,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      this.logger.log(
        `WhatsApp template sent to ${to}: ${JSON.stringify(data)}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error sending WhatsApp to ${to}: ${error}`);
      return false;
    }
  }

  /**
   * Send a free-form text message (only allowed within 24h window)
   * @param to Phone number
   * @param content Message content
   */
  async sendTextMessage(to: string, content: string): Promise<boolean> {
    const formattedTo = to.replace('+', '');
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'text',
      text: {
        preview_url: false,
        body: content,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      this.logger.log(`WhatsApp text sent to ${to}: ${JSON.stringify(data)}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending WhatsApp text to ${to}: ${error}`);
      return false;
    }
  }
}
