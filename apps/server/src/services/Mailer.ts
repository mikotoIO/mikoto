import path from 'path';
import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs/promises';
import ejs from 'ejs';

export default class Mailer {
  transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT!, 10),
      secure: process.env.MAIL_PORT === '465',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      }
    });
  }
  // send mail using nodemailer
  async sendMail(to: string, subject: string, template: string, data: any) {
    console.log(path.join(__dirname, '../../emails'))
    const t = await fs.readFile(path.join(__dirname, '../../emails', template), { encoding: 'utf8' })

    const html = await ejs.render(t, data, {
      root: path.join(__dirname, '../../emails'),
      async: true,
    });

    await this.transporter.sendMail({
      from: 'Mikoto.io <system@mikoto.io>',
      to,
      subject,
      html,
    });
  }
}
