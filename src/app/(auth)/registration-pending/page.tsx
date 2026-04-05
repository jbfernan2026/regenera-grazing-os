"use client";

import Link from "next/link";

export default function RegistrationPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-800">
      <div className="w-full max-w-md px-6 py-8 bg-green-800 bg-opacity-50 rounded-lg backdrop-blur-sm border border-green-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ¡Registro Exitoso!
          </h1>
          <p className="text-green-100">Tu cuenta está siendo revisada</p>
        </div>

        <div className="bg-green-700 bg-opacity-40 rounded-lg p-4 mb-6">
          <p className="text-green-50 text-sm text-center mb-3">
            Tu cuenta ha sido creada exitosamente. El administrador debe
            aprobarla antes de que puedas acceder a la plataforma.
          </p>
          <p className="text-green-100 text-xs text-center">
            Recibirás un correo de confirmación cuando tu cuenta sea aprobada.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Volver al Login
          </Link>
          <p className="text-center text-green-100 text-sm">
            ¿Preguntas?{" "}
            <a href="mailto:support@regenera.com" className="underline hover:text-white">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}