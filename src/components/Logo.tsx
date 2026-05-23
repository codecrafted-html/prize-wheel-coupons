import logo from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Poké-Loco — Crazy Healthy & Delicious"
      className={className}
      width={160}
      height={130}
    />
  );
}
