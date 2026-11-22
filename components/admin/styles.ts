// The admin forms' inputs and save buttons, as the mockups drew them. Save is light rather than Tesla red, which is
// below 4.5:1 for button text (globals.css).
export const INPUT = "h-9 w-full min-w-0 rounded-md border border-input bg-input/30 px-2.5 font-mono text-sm text-foreground "
  + "placeholder:text-muted-foreground/60 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring "
  + "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20";

export const SAVE = "inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background "
  + "hover:bg-foreground/90 outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50";

export const OUTLINE = "inline-flex h-8 items-center justify-center rounded-md border border-input bg-input/30 px-3 text-[13px] font-medium "
  + "hover:bg-input/50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50";
