# Proposal

## Why

On a phone the top bar follows the desktop layout: its six page links wrap onto two rows. The range presets do the same: Impact's six presets take two rows of buttons and the dates button a third. A phone shows about 200 px of header and up to four rows of controls before any figure. The mockups (https://claude.ai/artifact/CPvmMcKaLWuUFt5Lts9V1j) put both behind menus and bring the content up.

## What Changes

- Below 640 px wide, the top bar's page links become a hamburger button at the end of the brand row, a fixed 44 px square. It opens a menu of the six pages in their order, with the current page marked. The bars turn into an X while the menu is open and back again when it closes. The menu fades and grows in from the button's corner and leaves the same way in reverse.
- Below 640 px, each group of range presets becomes one menu button naming the chosen preset, beside the dates button. A True-Up or Backup group's Earlier years join that menu in their place, so the phone has one menu, not a menu inside a menu.
- The readings switch and Top Ten's VPP switch stay as two buttons: two choices already fit one row.
- From 640 px up, nothing changes.
- With reduced motion on, the icon and both kinds of menu change at once.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: the page links on a phone are a menu, not a wrapping row (navigation, the frame on a phone, the clicked tab and the gliding highlight), and the range presets on a phone are a menu.
- `true-up-tracker`: the year picker's Earlier menu is a wide-screen control; on a phone its years are in the presets menu.
- `backup-history`: the same for the Backup section's year picker.

## Impact

- `components/top-bar.tsx`: a phone-only page menu beside the wide-screen links.
- `components/solar/range-controls.tsx`: `PresetGroup` gains a phone-only menu, so the Solar, Impact, True-Up and Backup controls all change with it.
- `app/motion.css`: the hamburger's bars and the reduced-motion block.
- No new dependency: the menus use the Popover the Earlier menu and the dates picker already use.
