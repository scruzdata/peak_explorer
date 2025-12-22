import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Email del superadmin permitido
const SUPERADMIN_EMAIL = 'maitaiweb@gmail.com'

// Validar que las credenciales de Google estén configuradas
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!googleClientId || !googleClientSecret) {
  console.error('❌ Error: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados en .env.local')
  console.error('Por favor, configura las credenciales de Google OAuth en tu archivo .env.local')
}


const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId || '',
      clientSecret: googleClientSecret || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Solo permitir el acceso al superadmin
      if (user.email === SUPERADMIN_EMAIL) {
        return true
      }
      // Bloquear acceso para cualquier otro usuario
      return false
    },
    async session({ session, token }) {
      // Agregar información adicional a la sesión
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = session.user.email === SUPERADMIN_EMAIL ? 'admin' : 'user'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.email === SUPERADMIN_EMAIL ? 'admin' : 'user'
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

