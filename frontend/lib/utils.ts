import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatProvider(value: string) {
  switch (value.toLowerCase()) {
    case "gmail":
      return "Gmail";
    case "instagram":
      return "Instagram";
    case "whatsapp":
      return "WhatsApp";
    case "facebook":
      return "Facebook";
    case "twitter":
      return "Twitter";
    case "facebook_messenger":
    case "facebook-messenger":
      return "Facebook Messenger";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

export function getInitials(name?: string | null) {
  if (!name) {
    return "UI";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
