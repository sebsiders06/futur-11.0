'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const GMAIL_USER = (process.env.GMAIL_USER || '').trim();
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').trim();
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'philippe.clemente@orange.fr';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const gmailTransporter = (GMAIL_USER && GMAIL_APP_PASSWORD)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    })
  : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen || 10000);
}

app.post('/api/contact', async (req, res) => {
  try {
    const { nom, email, message } = req.body || {};

    const nomClean = sanitize(nom, 200);
    const emailClean = (email && String(email).trim()) || '';
    const messageClean = sanitize(message, 5000);

    if (!nomClean) {
      return res.status(400).json({ success: false, message: 'Le nom est requis.' });
    }
    if (!emailClean) {
      return res.status(400).json({ success: false, message: 'L\'email est requis.' });
    }
    if (!validateEmail(emailClean)) {
      return res.status(400).json({ success: false, message: 'Email invalide.' });
    }
    if (!messageClean) {
      return res.status(400).json({ success: false, message: 'Le message est requis.' });
    }

    const subject = `[Formation SST] Demande de devis – ${nomClean}`;
    const textBody = `Nom : ${nomClean}\nEmail : ${emailClean}\n\nMessage :\n${messageClean}`;
    const htmlBody = `<p><strong>Nom :</strong> ${escapeHtml(nomClean)}</p><p><strong>Email :</strong> ${escapeHtml(emailClean)}</p><p><strong>Message :</strong></p><p>${escapeHtml(messageClean).replace(/\n/g, '<br>')}</p>`;

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: CONTACT_EMAIL,
        replyTo: emailClean,
        subject,
        text: textBody,
        html: htmlBody,
      });
      if (error) {
        console.error('Resend error:', error);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message. Réessayez plus tard.' });
      }
      return res.json({ success: true, message: 'Votre message a bien été envoyé.' });
    }

    if (gmailTransporter) {
      try {
        await gmailTransporter.sendMail({
          from: GMAIL_USER,
          to: CONTACT_EMAIL,
          replyTo: emailClean,
          subject,
          text: textBody,
          html: htmlBody,
        });
        return res.json({ success: true, message: 'Votre message a bien été envoyé.' });
      } catch (err) {
        console.error('Nodemailer error:', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message. Réessayez plus tard.' });
      }
    }

    console.warn('Aucun service email configuré (RESEND_API_KEY ou GMAIL_USER+GMAIL_APP_PASSWORD).', { nom: nomClean, email: emailClean });
    return res.status(503).json({ success: false, message: 'Service d\'envoi d\'emails non configuré. Contactez-nous par téléphone ou directement par email.' });
  } catch (err) {
    console.error('POST /api/contact:', err);
    res.status(500).json({ success: false, message: 'Une erreur est survenue. Réessayez plus tard.' });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.listen(PORT, () => {
  console.log('Serveur démarré sur http://localhost:' + PORT);
  if (resend) console.log('Envoi d\'emails : Resend activé.');
  else if (gmailTransporter) console.log('Envoi d\'emails : Gmail activé.');
  else console.warn('Aucun service email configuré. Définir RESEND_API_KEY ou GMAIL_USER + GMAIL_APP_PASSWORD dans .env');
});
