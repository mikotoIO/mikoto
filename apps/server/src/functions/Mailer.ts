import ejs from 'ejs';
import fs from 'fs/promises';
import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';

export default class Mailer {
  transporter: Transporter;
  senderAccount: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT!, 10),
      secure: process.env.MAIL_SECURE
        ? process.env.MAIL_SECURE.toLowerCase() === 'true'
        : process.env.MAIL_PORT === '465',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    this.senderAccount = `Mikoto.io <${process.env.MAIL_FROM!}>`;
  }
  // send mail using nodemailer
  async sendMail(to: string, subject: string, template: string, data: any) {
    const t = await fs.readFile(
      path.join(__dirname, '../../emails', template),
      { encoding: 'utf8' },
    );

    const html = await ejs.render(t, data, {
      root: path.join(__dirname, '../../emails'),
      async: true,
    });

    await this.transporter.sendMail({
      from: `Mikoto.io <${process.env.MAIL_FROM!}>`,
      to,
      subject,
      html,
    });
  }
}
