const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, resetToken, name, surname, isPasswordReset = false) => {
  // Configuración del transporte de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Definir el asunto y el texto dependiendo de si es recuperación de contraseña o verificación
  const subject = isPasswordReset ? 'Recuperación de contraseña' : 'Verificación de cuenta';

  // Crear el enlace dependiendo de si es recuperación de contraseña o verificación
  const link = isPasswordReset 
    ? `${process.env.FRONTEND_URL}/reset-password/${resetToken}`  // Usar el token de recuperación
    : `${process.env.FRONTEND_URL}/verify/${encodeURIComponent(email)}`;

  // Crear el texto del correo
  const text = isPasswordReset 
    ? `Hola ${name} ${surname},\n\nHaz clic en el siguiente enlace para restablecer tu contraseña: ${link}.`
    : `Hola ${name} ${surname},\n\nHaz clic en el siguiente enlace para verificar tu cuenta: ${link}.`;

  // Crear el HTML del correo con un enlace clickeable
  const html = `
    <html>
      <body>
        <h2>¡Bienvenido a TecnoShop Online!</h2>
        <p>Hola ${name} ${surname},</p>
        <p>${isPasswordReset 
          ? `Haz clic en el siguiente enlace para restablecer tu contraseña:`
          : `Haz clic en el siguiente enlace para verificar tu cuenta:`}
        </p>
        <p><a href="${link}">Haz clic aquí para ${isPasswordReset ? 'restablecer tu contraseña' : 'verificar tu cuenta'}</a></p>
        <p>Si no has solicitado este cambio, ignora este correo.</p>
      </body>
    </html>
  `;

  // Opciones del correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    // Enviar el correo
    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a ${email}`);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
};

module.exports = sendVerificationEmail;
