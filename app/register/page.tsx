import { Metadata } from "next";
import RegistrationForm from "@/components/register-form";

export const metadata: Metadata = {
  title: "ลงทะเบียนสมาชิก - NAI CHA",
  description: "ลงทะเบียนเพื่อเป็นสมาชิกและรับสิทธิประโยชน์",
  icons: {
    icon: "/NAICHA.png",
  },
};

export default function RegisterPage() {
  return <RegistrationForm />;
}
