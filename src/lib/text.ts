export function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function emailLocalPart(email: string): string {
  return email.split("@")[0] ?? email;
}
