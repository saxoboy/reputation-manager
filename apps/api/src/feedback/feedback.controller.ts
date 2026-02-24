import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SendGridService } from '@reputation-manager/integrations';

class SubmitFeedbackDto {
  type: 'bug' | 'suggestion' | 'question';
  message: string;
  url?: string;
  userEmail?: string;
}

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly emailService: SendGridService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async submit(@Body() dto: SubmitFeedbackDto) {
    const to = process.env.FEEDBACK_EMAIL;
    if (!to) return;

    const typeLabel =
      {
        bug: '🐛 Bug',
        suggestion: '💡 Sugerencia',
        question: '❓ Pregunta',
      }[dto.type] ?? dto.type;

    await this.emailService.sendEmail({
      to,
      subject: `[Beta Feedback] ${typeLabel}`,
      html: `
        <h2>Nuevo feedback de beta tester</h2>
        <p><strong>Tipo:</strong> ${typeLabel}</p>
        ${dto.userEmail ? `<p><strong>Usuario:</strong> ${dto.userEmail}</p>` : ''}
        ${dto.url ? `<p><strong>Página:</strong> ${dto.url}</p>` : ''}
        <hr />
        <p>${dto.message.replace(/\n/g, '<br />')}</p>
      `,
    });
  }
}
