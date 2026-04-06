import { Resend } from "resend";
import { prisma } from "@/lib/db/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  type: "password-reset" | "approval" | "rejection" | "invitation";
  data: Record<string, any>;
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, type, data } = options;

  try {
    // Log en BD antes de enviar
    const emailLog = await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        subject,
        type,
        status: "PENDING",
        metadata: data,
      },
    });

    // Preparar contenido según tipo
    let htmlContent = "";
    let textContent = "";

    switch (type) {
      case "password-reset":
        htmlContent = `
          <h2>Restablecer Contraseña</h2>
          <p>Tu nueva contraseña temporal es: <strong>${data.newPassword}</strong></p>
          <p>Por favor, cámbiala al iniciar sesión.</p>
        `;
        textContent = `Tu nueva contraseña temporal es: ${data.newPassword}`;
        break;

      case "approval":
        htmlContent = `
          <h2>¡Bienvenido a Regenera Grazing OS!</h2>
          <p>Tu cuenta ha sido aprobada por el administrador.</p>
          <p>Ya puedes acceder a la plataforma con tus credenciales.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Iniciar Sesión</a>
        `;
        textContent = `Tu cuenta ha sido aprobada. Accede en ${process.env.NEXT_PUBLIC_APP_URL}/login`;
        break;

      case "rejection":
        htmlContent = `
          <h2>Solicitud Rechazada</h2>
          <p>Lamentablemente, tu solicitud de registro ha sido rechazada.</p>
          <p>Si tienes preguntas, contacta con soporte.</p>
        `;
        textContent = `Tu solicitud ha sido rechazada.`;
        break;

      case "invitation":
        htmlContent = `
          <h2>Invitación a Regenera Grazing OS</h2>
          <p>Has sido invitado a unirte a una organización.</p>
          <p>Haz clic en el enlace para aceptar:</p>
          <a href="${data.invitationLink}">Aceptar Invitación</a>
        `;
        textContent = `Has sido invitado. Acepta en: ${data.invitationLink}`;
        break;
    }

    // Enviar con Resend
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });

    // Actualizar log con resultado
    if (result.error) {
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: "FAILED",
          error: JSON.stringify(result.error),
        },
      });
      console.error("Email send error:", result.error);
      return { success: false, error: result.error };
    }

    // Marcar como enviado
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
}

// Generar contraseña aleatoria
export function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}