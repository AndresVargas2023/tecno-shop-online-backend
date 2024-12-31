const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, codeOrToken, name, surname, isPasswordReset = false) => {
  // Configuración del transporte de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Puedes usar otro servicio como SendGrid, Mailgun, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Definir el asunto dependiendo de si es recuperación de contraseña o verificación
  const subject = isPasswordReset 
    ? 'Recuperación de contraseña - TecnoShop Online' 
    : 'Verificación de cuenta - TecnoShop Online';

  // Crear el enlace o mensaje dependiendo del propósito del correo
  const link = isPasswordReset 
    ? `${process.env.FRONTEND_URL}/reset-password/${codeOrToken}`
    : `${process.env.FRONTEND_URL}/verify/${encodeURIComponent(email)}`;

  const actionText = isPasswordReset ? 'restablecer tu contraseña' : 'verificar tu cuenta';

  // Crear el texto del correo para clientes que no soportan HTML
  const text = isPasswordReset 
    ? `Hola ${name} ${surname},\n\nHaz clic en el siguiente enlace para restablecer tu contraseña: ${link}.`
    : `Hola ${name} ${surname},\n\nHaz clic en el siguiente enlace para verificar tu cuenta: ${link}.`;

  // Crear el HTML del correo con un diseño mejorado
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0;">
        <div style="text-align: center;">
          <img src="https://drive.google.com/uc?export=view&id=1tg5uv4InMaljKdD7Zjeuy1j-ftJbOJ6d" alt="TecnoShop Logo" style="display: block; margin: 0 auto; max-width: 150px;">
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px;">
          <h2 style="color: #333; text-align: center;">¡Bienvenido a TecnoShop Online!</h2>
          <p style="font-size: 16px; color: #333; text-align: center;">Hola ${name} ${surname},</p>
          <p style="font-size: 16px; color: #333; text-align: center;">${isPasswordReset ? 'Haz clic en el siguiente enlace para restablecer tu contraseña:' : 'Haz clic en el siguiente enlace para verificar tu cuenta:'}</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${actionText}</a>
          </p>
          <p style="font-size: 14px; color: #aaa; text-align: center;">Si no has solicitado este cambio, ignora este correo.</p>
        </div>
        <footer style="font-size: 14px; color: #aaa; margin-top: 20px; text-align: center;">
          <p>Gracias por elegir <strong>TecnoShop Online</strong>!</p>
          <!-- Redes Sociales -->
          <div style="margin-top: 20px;">
            <a href="https://www.facebook.com/people/TecnoShop-Online/61570247912665/" target="_blank" style="text-decoration: none; margin-right: 10px;">
              <img src="https://cdn.icon-icons.com/icons2/2699/PNG/512/facebook_official_logo_icon_169181.png" alt="Facebook" style="width: 30px; height: 30px;">
            </a>
            <a href="https://www.tiktok.com/@tecnoshop_online24" target="_blank" style="text-decoration: none; margin-right: 10px;">
              <img src="https://static.vecteezy.com/system/resources/previews/021/495/994/non_2x/tiktok-social-media-logo-icon-free-png.png" alt="TikTok" style="width: 30px; height: 30px;">
            </a>
            <a href="https://www.instagram.com/tecnoshopoline24/" target="_blank" style="text-decoration: none; margin-right: 10px;">
              <img src="https://png.pngtree.com/element_our/sm/20180630/sm_5b37de3263964.jpg" alt="Instagram" style="width: 30px; height: 30px;">
            </a>
            <a href="https://wa.me/595984086958" target="_blank" style="text-decoration: none;">
              <img src="https://e7.pngegg.com/pngimages/829/586/png-clipart-whatsapp-logo-whatsapp-logo-desktop-computer-icons-viber-grass-viber-thumbnail.png" alt="WhatsApp" style="width: 30px; height: 30px;">
            </a>
          </div>
        </footer>
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
