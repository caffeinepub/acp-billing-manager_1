import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "oklch(0.26 0.065 241)" }}
    >
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            ACP Billing Manager
          </CardTitle>
          <CardDescription className="text-sm">
            Professional ACP Sheet Inventory & Billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground text-center">
            Secure login via Internet Identity.
            <br />
            No password required.
          </div>

          {isLoginError && (
            <div
              data-ocid="login.error_state"
              className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg"
            >
              {loginError?.message ?? "Login failed. Please try again."}
            </div>
          )}

          <Button
            data-ocid="login.primary_button"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            onClick={login}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Admin &amp; Staff access via Internet Identity
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
