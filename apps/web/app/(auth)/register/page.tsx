import { RegisterForm } from '../../../components/auth/register-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reputation Manager</h1>
          <p className="text-muted-foreground">
            Crea tu cuenta y comienza a mejorar tu reputación online
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
