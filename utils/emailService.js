const nodemailer = require('nodemailer');

// Función para enviar el correo de verificación o recuperación
const sendVerificationEmail = async (email, code, isPasswordReset = false) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Puedes usar otro servicio como SendGrid, Mailgun, etc.
    auth: {
      user: process.env.EMAIL_USER,  // Correo de Gmail (debe estar en tu .env)
      pass: process.env.EMAIL_PASS,  // Contraseña de la aplicación (también en tu .env)
    },
  });

  const subject = isPasswordReset ? 'Recuperación de contraseña' : 'Código de verificación';
  const text = isPasswordReset 
    ? `Tu código de verificación para restablecer tu contraseña es: ${code}` 
    : `Tu código de verificación es: ${code}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,   // Correo de Gmail
    to: email,                      // Correo destinatario
    subject: subject,
    text: text,  // El código o mensaje adecuado
  };

  try {
    // Imprimir en consola el código que se va a enviar
    console.log(`Enviando el siguiente mensaje: ${text}`);

    // Intentamos enviar el correo
    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a ${email}`);  // Confirma que el correo fue enviado
  } catch (error) {
    console.error('Error al enviar el correo:', error);  // Si hay algún error, lo imprimimos
  }
};

module.exports = sendVerificationEmail;
