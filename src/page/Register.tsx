import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  CarFront,
  CircleCheck,
  CircleUserRound,
  IdCard,
  Lock,
  Mail,
  Palette,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import LoopLogo from "@/components/LoopLogo";
import { useRegister } from "@/API/auth-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RegisterStateT } from "@/API/auth-api-types";

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  type?: "text" | "email" | "password" | "tel";
};

const INITIAL_REGISTER_STATE: RegisterStateT = {
  driver_details: {
    phone_number: "",
    license_number: "",
    vehicle_type: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_color: "",
    license_plate: "",
  },
  user_details: {
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
  },
};

const fieldLabelClassName =
  "mb-2 text-base font-bold tracking-tight text-zinc-800";
const inputClassName =
  "h-12 rounded-xl border-zinc-300 bg-zinc-50/80 pl-11 text-[15px] font-jetbrains font-semibold tracking-[0.01em] shadow-none transition-all duration-200 focus:bg-white";

function Field({
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
  type = "text",
}: FieldProps) {
  return (
    <label className="block">
      <p className={fieldLabelClassName}>{label}</p>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>
    </label>
  );
}

function Register() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const { mutateAsync: registerMutateAsync, isPending: isRegistering } =
    useRegister();
  const [registerState, setRegisterState] = useState<RegisterStateT>(
    INITIAL_REGISTER_STATE,
  );

  const isUserDetailsValid = useMemo(() => {
    const { email, password, full_name, phone_number } =
      registerState.user_details;
    return (
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      full_name.trim().length > 0 &&
      phone_number.trim().length > 0
    );
  }, [registerState.user_details]);

  const isDriverDetailsValid = useMemo(() => {
    const {
      phone_number,
      license_number,
      vehicle_type,
      vehicle_make,
      vehicle_model,
      vehicle_color,
      license_plate,
    } = registerState.driver_details;

    return (
      phone_number.trim().length > 0 &&
      license_number.trim().length > 0 &&
      vehicle_type.trim().length > 0 &&
      vehicle_make.trim().length > 0 &&
      vehicle_model.trim().length > 0 &&
      vehicle_color.trim().length > 0 &&
      license_plate.trim().length > 0
    );
  }, [registerState.driver_details]);

  const updateUserDetails = <K extends keyof RegisterStateT["user_details"]>(
    key: K,
    value: RegisterStateT["user_details"][K],
  ) => {
    setError("");
    setRegisterState((prev) => ({
      ...prev,
      user_details: {
        ...prev.user_details,
        [key]: value,
      },
    }));
  };

  const updateDriverDetails = <K extends keyof RegisterStateT["driver_details"]>(
    key: K,
    value: RegisterStateT["driver_details"][K],
  ) => {
    setError("");
    setRegisterState((prev) => ({
      ...prev,
      driver_details: {
        ...prev.driver_details,
        [key]: value,
      },
    }));
  };

  const goToDriverSlide = () => {
    if (!isUserDetailsValid) {
      setError("Please complete all user details before continuing.");
      return;
    }

    setError("");
    setSlide(2);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isDriverDetailsValid) {
      setError("Please complete all driver details before submitting.");
      return;
    }

    try {
      setError("");
      console.log("register payload", registerState);
      await registerMutateAsync(registerState);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    }
  };

  return (
    <div className="font-roboto relative min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_0%_0%,#dcfce7,transparent_35%),radial-gradient(circle_at_100%_100%,#e2e8f0,transparent_30%),linear-gradient(145deg,#f8fafc,#f1f5f9)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-0 top-0 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <Card className="w-full border-zinc-200/80 bg-white/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-3 border-b border-zinc-200/80 pb-3">
            <div className="flex items-center justify-between gap-4">
              <LoopLogo
                className="items-center gap-4"
                markClassName="h-16 w-16 rounded-3xl [&>span:first-child]:text-3xl"
                textClassName="text-4xl tracking-[0.18em]"
              />
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                Driver Signup
              </Badge>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900">
                Create your driver account
              </CardTitle>
              <CardDescription className="text-base font-medium text-zinc-600">
                A quick 2-step form to get you ready for Loop.
              </CardDescription>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-base font-semibold transition ${
                    slide === 1
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-zinc-100 text-zinc-600"
                  }`}
                >
                  <CircleUserRound className="h-5 w-5" />
                  <span>User details</span>
                  {isUserDetailsValid ? (
                    <CircleCheck className="ml-auto h-5 w-5" />
                  ) : null}
                </div>
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-base font-semibold transition ${
                    slide === 2
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-zinc-100 text-zinc-600"
                  }`}
                >
                  <CarFront className="h-5 w-5" />
                  <span>Driver details</span>
                  {isDriverDetailsValid ? (
                    <CircleCheck className="ml-auto h-5 w-5" />
                  ) : null}
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-500">
                {slide === 1
                  ? "Start with your account details."
                  : "Now add vehicle and license details."}
              </p>
            </div>
          </CardHeader>

          <CardContent className="pt-3">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-base font-bold text-red-800">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <form onSubmit={handleSubmit} className="space-y-4">
                {slide === 1 ? (
                  <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3.5 sm:p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-800">
                      <ShieldCheck className="h-5 w-5" />
                      Personal info
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field
                          label="Full name"
                          icon={UserRound}
                          value={registerState.user_details.full_name}
                          onChange={(value) =>
                            updateUserDetails("full_name", value)
                          }
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Field
                          label="Email"
                          type="email"
                          icon={Mail}
                          value={registerState.user_details.email}
                          onChange={(value) =>
                            updateUserDetails("email", value)
                          }
                          placeholder="you@example.com"
                        />
                      </div>

                      <Field
                        label="Password"
                        type="password"
                        icon={Lock}
                        value={registerState.user_details.password}
                        onChange={(value) =>
                          updateUserDetails("password", value)
                        }
                        placeholder="Enter password"
                      />

                      <Field
                        label="Phone number"
                        type="tel"
                        icon={Phone}
                        value={registerState.user_details.phone_number}
                        onChange={(value) =>
                          updateUserDetails("phone_number", value)
                        }
                        placeholder="9876543210"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={goToDriverSlide}
                      disabled={isRegistering}
                      className="mt-4 h-11 w-full text-base font-semibold"
                    >
                      Continue to driver details
                    </Button>
                  </section>
                ) : (
                  <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3.5 sm:p-4">
                    <div className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-800">
                      <CarFront className="h-5 w-5" />
                      Vehicle and license info
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Driver phone number"
                        type="tel"
                        icon={Phone}
                        value={registerState.driver_details.phone_number}
                        onChange={(value) =>
                          updateDriverDetails("phone_number", value)
                        }
                        placeholder="1234567890"
                      />

                      <Field
                        label="License number"
                        icon={IdCard}
                        value={registerState.driver_details.license_number}
                        onChange={(value) =>
                          updateDriverDetails("license_number", value)
                        }
                        placeholder="LIC-7788"
                      />

                      <Field
                        label="Vehicle type"
                        icon={CarFront}
                        value={registerState.driver_details.vehicle_type}
                        onChange={(value) =>
                          updateDriverDetails("vehicle_type", value)
                        }
                        placeholder="Car"
                      />

                      <Field
                        label="Vehicle make"
                        icon={CarFront}
                        value={registerState.driver_details.vehicle_make}
                        onChange={(value) =>
                          updateDriverDetails("vehicle_make", value)
                        }
                        placeholder="Toyota"
                      />

                      <Field
                        label="Vehicle model"
                        icon={CarFront}
                        value={registerState.driver_details.vehicle_model}
                        onChange={(value) =>
                          updateDriverDetails("vehicle_model", value)
                        }
                        placeholder="Corolla"
                      />

                      <Field
                        label="Vehicle color"
                        icon={Palette}
                        value={registerState.driver_details.vehicle_color}
                        onChange={(value) =>
                          updateDriverDetails("vehicle_color", value)
                        }
                        placeholder="White"
                      />

                      <div className="sm:col-span-2">
                        <Field
                          label="License plate"
                          icon={IdCard}
                          value={registerState.driver_details.license_plate}
                          onChange={(value) =>
                            updateDriverDetails("license_plate", value)
                          }
                          placeholder="ABC-1234"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setError("");
                          setSlide(1);
                        }}
                        disabled={isRegistering}
                        className="h-11 font-semibold"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="h-11 font-semibold"
                        disabled={isRegistering}
                      >
                        {isRegistering
                          ? "Submitting registration..."
                          : "Submit registration"}
                      </Button>
                    </div>
                  </section>
                )}
              </form>

              <aside className="hidden rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 lg:block">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Setup checklist
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-zinc-800">
                      Step 1
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      User profile details
                    </p>
                    {isUserDetailsValid ? (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CircleCheck className="h-3.5 w-3.5" />
                        Complete
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-zinc-800">
                      Step 2
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Driver and vehicle details
                    </p>
                    {isDriverDetailsValid ? (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CircleCheck className="h-3.5 w-3.5" />
                        Complete
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                  Fill both steps to continue login setup.
                </div>
              </aside>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-zinc-200/80 pt-6 text-base font-medium text-zinc-600">
            Already have an account?
            <Button
              asChild
              variant="link"
              className="h-auto px-1 font-semibold text-zinc-900"
            >
              <Link to="/login">Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Register;
