const nodemailer = require('nodemailer');

// Función para enviar el correo de verificación o recuperación
const sendVerificationEmail = async (email, code, name, surname, isPasswordReset = false) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Puedes usar otro servicio como SendGrid, Mailgun, etc.
    auth: {
      user: process.env.EMAIL_USER,  // Correo de Gmail (debe estar en tu .env)
      pass: process.env.EMAIL_PASS,  // Contraseña de la aplicación (también en tu .env)
    },
  });

  const subject = isPasswordReset ? 'Recuperación de contraseña - TecnoShop Online' : 'Verificación de cuenta - TecnoShop Online';
  const text = isPasswordReset 
    ? `Hola ${name} ${surname},\n\nTu código de verificación para restablecer tu contraseña es: ${code}.`
    : `Hola ${name} ${surname},\n\nTu código de verificación es: ${code}.`;

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0;">
        <div style="text-align: center;">
         <img src="https://drive.google.com/uc?export=view&id=1tg5uv4InMaljKdD7Zjeuy1j-ftJbOJ6d" alt="TecnoShop Logo" style="display: block; margin: 0 auto; max-width: 150px; border-radius: 0;">
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px;">
          <h2 style="color: #333; text-align: center;">¡Bienvenido a TecnoShop Online!</h2>
          <p style="font-size: 16px; color: #333; text-align: center;">Hola ${name} ${surname},</p>
          <p style="font-size: 16px; color: #333; text-align: center;">${isPasswordReset ? 'Tu código de verificación para restablecer tu contraseña' : 'Tu código de verificación'} es:</p>
          <h3 style="color: #2c3e50; font-size: 20px; text-align: center;">${code}</h3>

          <footer style="font-size: 14px; color: #aaa; margin-top: 20px; text-align: center;">
            <p>Si no has solicitado este cambio, ignora este correo.</p>
            <p>Gracias por elegir <strong>TecnoShop Online</strong>!</p>

            <!-- Redes Sociales -->
            <div style="margin-top: 20px; text-align: center;">
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
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,  // Correo de Gmail
    to: email,                    // Correo destinatario
    subject: subject,
    text: text,  // El código o mensaje adecuado (por si el cliente no soporta HTML)
    html: html,  // El mensaje HTML
  };

  try {
    // Imprimir en consola el código que se va a enviar
    console.log(`Enviando el siguiente mensaje a ${email}: ${text}`);

    // Intentamos enviar el correo
    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a ${email}`);  // Confirma que el correo fue enviado
  } catch (error) {
    console.error('Error al enviar el correo:', error);  // Si hay algún error, lo imprimimos
  }
};

module.exports = sendVerificationEmail;
