import type { MetadataRoute } from "next";

const SOCIAL_PREVIEW_BOTS = [
  "WhatsApp",
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot-LinkExpanding",
  "Slackbot",
  "TelegramBot",
  "Discordbot",
  "Pinterestbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...SOCIAL_PREVIEW_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}
