import { LoginForm } from '../../../components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reputation Manager</h1>
          <p className="text-muted-foreground">
            Gestión de feedback para profesionales de la salud
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
