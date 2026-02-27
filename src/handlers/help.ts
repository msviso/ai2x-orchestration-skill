import type { HelpResult, RuntimeContext } from "../types/index.js";

export async function helpHandler(_ctx: RuntimeContext): Promise<HelpResult> {
  return {
    ok: true,
    project: "AI2X Multi-Display",
    vendor: "Microsense Vision Co., Ltd.",
    what:
      "AI2X is a multi-display gateway that pairs screens with controllers and issues secure assignments so agents can push governed content to displays.",
    displayEntryUrl: "ai2x.link",
    pairing: [
      "Open ai2x.link on the display device (or its built-in browser).",
      "The page shows a pair code and QR code.",
      "Scan the QR or enter the pair code on a controller device using the AI2X skill.",
      "The skill claims the display and returns an assignmentId.",
      "Use the assignmentId to push boards/widgets to that display."
    ],
    support: {
      email: "allan@msviso.com",
      referenceSite: "www.msviso.com"
    },
    notes: [
      "To start or refresh pairing, open ai2x.link on the display.",
      "If pairing fails or expires, refresh ai2x.link to generate a new pair code."
    ]
  };
}
