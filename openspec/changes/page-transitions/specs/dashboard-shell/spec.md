# Spec Delta

## ADDED Requirements

### Requirement: The clicked tab shows at once
When a viewer chooses another page in the top bar, its link SHALL brighten at once, while the page loads. The current page's red underline and its marking for assistive technology SHALL stay on the old page's link until the new page arrives.

#### Scenario: A slow page
- **WHEN** a viewer on `/` chooses "True-Up" and the page takes 0.4 s to arrive
- **THEN** "True-Up" brightens on the click, and "Solar" keeps the underline and stays marked as the current page until True-Up arrives

### Requirement: The highlight and the page move together
When the new page arrives, the current page's highlight SHALL glide from the old link to the new one in 250 ms. In the same pass, the old content SHALL leave 24 px against the direction of travel in 150 ms, and the new content SHALL come in from the far side in 250 ms. The direction SHALL follow the tabs' order. The top bar, with its live status, SHALL not move.

#### Scenario: Going right
- **WHEN** a viewer on Impact chooses "Patterns" and Patterns arrives
- **THEN** the highlight glides right to "Patterns", Impact's content leaves to the left and Patterns' comes in from the right, starting together

#### Scenario: Going left
- **WHEN** a viewer on Top Ten chooses "Solar"
- **THEN** the highlight glides left and the new content comes in from the left

#### Scenario: The live status during the pass
- **WHEN** a live status arrives while a page change is moving
- **THEN** the top bar's live status updates as usual and doesn't slide

#### Scenario: Other navigation
- **WHEN** a viewer picks another range on the Solar page, or follows a link inside a page
- **THEN** neither the highlight nor the page slides as for a tab change

### Requirement: Page changes without motion
When the viewer's system asks for reduced motion, or the browser can't animate page changes, choosing a page SHALL change the highlight and the content at once, as a plain navigation.

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on chooses "Impact"
- **THEN** the clicked tab brightens on the click, and when Impact arrives the underline and the content change at once
