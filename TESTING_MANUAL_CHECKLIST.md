# Phase 3 - Enhanced Animations & Visuals: Manual Testing Checklist

## Overview
This document provides comprehensive manual testing procedures to validate all animation features in the Exquisite Corpse multiplayer game.

## Quick Reference: Animation Elements

| Component | Animation Type | Duration | Expected Behavior |
|-----------|---------------|----------|-------------------|
| **Screen Transitions** | Fade-in with slide-up | 0.3s | Opacity 0→1, translateY 10px→0 |
| **Loading Spinner** | Rotation with bounce | 1s (cubic-bezier) | Smooth 360deg rotation with easing |
| **Pulse (Waiting)** | Opacity pulse | 2s infinite | Opacity oscillates 1→0.5→1 |
| **Confetti** | Fall animation | 2-4s variable | Particles fall 100vh, rotate 720deg, fade |
| **Story Reveal** | Slide-in with fade | 0.6s staggered | Each sentence 100ms apart, slideX -30px→0 |
| **Active Player Glow** | Pulse glow | 2s infinite | Box-shadow pulses with color |
| **Button Press** | Scale down | 0.1s | Scale 1→0.95 on :active |
| **Button Hover** | Scale up | Instant | Scale 1→1.05 with Tailwind |
| **Reduced Motion** | All disabled | 0.01ms | All animations respect user preference |

## 1. Desktop Testing (Chrome)

### 1.1 Screen Transitions
- **Test Case**: Landing Page Fade-In
  - [ ] Navigate to `/`
  - [ ] Observe landing-screen slides in from bottom with fade
  - [ ] Should complete in ~0.3s smoothly
  - [ ] No jank or stuttering
  - **Expected**: Smooth fade-in, centered card appears

- **Test Case**: Lobby Screen Transition
  - [ ] Create a room (enter name)
  - [ ] Observe fade-in transition to lobby-screen
  - [ ] Landing screen fades out, lobby fades in
  - [ ] Room code displays clearly
  - **Expected**: Smooth transition, no white flash

- **Test Case**: Game Screen Transition
  - [ ] Click "Start Game" button
  - [ ] Observe fade-in to game-screen
  - [ ] Previous screen state clears
  - **Expected**: Game UI appears smoothly

### 1.2 Loading Spinner
- **Test Case**: Spinner CSS Definition
  - [ ] Inspect element: `<div class="loading-spinner"></div>`
  - [ ] Check computed styles in DevTools
  - [ ] Verify animation: `spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite`
  - [ ] Watch the spinner rotate with bounce effect
  - [ ] Should complete one rotation per second
  - **Expected**: Smooth bouncy rotation, not linear

### 1.3 Button Effects
- **Test Case**: Button Hover Scale
  - [ ] Hover over "Create New Room" button
  - [ ] Observe button scales up slightly (1.05x)
  - [ ] Release hover
  - [ ] Button returns to normal size
  - **Expected**: Smooth hover effect, interactive feel

- **Test Case**: Button Press Effect
  - [ ] Click any button
  - [ ] During click, button should scale down (0.95x)
  - [ ] Release click
  - [ ] Button returns to normal
  - [ ] Effect should be ~100ms
  - **Expected**: Tactile feedback, responsive

### 1.4 Confetti Animation
- **Prerequisites**: Complete a full game with 2 players, 1 sentence each
  - [ ] Player 1 creates room
  - [ ] Player 2 joins room
  - [ ] Set sentences to "1"
  - [ ] Start game
  - [ ] Player 1 writes sentence, submits
  - [ ] Player 2 writes sentence, submits

- **Test Case**: Confetti Triggers on Results
  - [ ] Results screen appears
  - [ ] 50 colored particles spawn from top
  - [ ] Particles fall down screen (translateY)
  - [ ] Particles rotate (720deg)
  - [ ] Particles fade out as they fall
  - [ ] Particles have random:
    - [ ] Horizontal positions
    - [ ] Colors (purple, pink, green, amber, blue)
    - [ ] Animation delays (0-0.5s)
    - [ ] Durations (2-4s)
  - [ ] All particles removed after 5s
  - **Expected**: Celebration effect, smooth particles, no lag

### 1.5 Story Reveal Animation
- **Test Case**: Sentences Appear with Stagger
  - [ ] On results screen with 2+ sentences
  - [ ] First sentence appears immediately
  - [ ] Second sentence appears 100ms later
  - [ ] Third sentence appears 100ms after second
  - [ ] Each sentence slides in from left (translateX -30px→0)
  - [ ] Fade-in effect (0→1 opacity) simultaneous
  - [ ] Animation duration: 0.6s per sentence
  - **Expected**: Staggered reveal, reads like story is being told

### 1.6 Pulse Animation (Waiting)
- **Prerequisites**: 2-player game, reach turn 2
  - [ ] Player 1 completes first sentence
  - [ ] Player 2's screen shows waiting state
  - [ ] Verify hourglass emoji (⏳) is visible
  - [ ] Watch emoji pulse smoothly
  - [ ] Opacity oscillates: 1 → 0.5 → 1
  - [ ] Cycle time: 2 seconds
  - [ ] Animation loops continuously
  - **Expected**: Gentle pulsing, not distracting

### 1.7 Active Player Glow
- **Test Case**: Glow Animation (if implemented on player card)
  - [ ] In lobby, look for active/highlighted player card
  - [ ] Check if glow effect present
  - [ ] Box-shadow should pulse:
    - [ ] 0 0 20px rgba(124, 58, 237, 0.4) at start
    - [ ] 0 0 30px rgba(124, 58, 237, 0.8) at peak
    - [ ] Duration: 2 seconds
  - **Expected**: Purple glow pulses around active player

### 1.8 Performance (60fps Check)
- **Test Case**: No Jank During Animations
  - [ ] Open Chrome DevTools → Performance tab
  - [ ] Record performance while:
    - [ ] Navigating between screens
    - [ ] Triggering confetti
    - [ ] Watching story reveal
  - [ ] Check FPS counter (should stay at 60fps)
  - [ ] Look for red bars in performance timeline (jank)
  - [ ] Verify GPU acceleration:
    - [ ] Animations use `transform` and `opacity`
    - [ ] No expensive properties (background-color in animations)
  - **Expected**: Smooth 60fps, no dropped frames

### 1.9 Prefers-Reduced-Motion
- **Test Case**: Respect User Motion Preferences
  - [ ] Open System Settings → Accessibility → Display → Reduce motion
  - [ ] Enable "Reduce motion"
  - [ ] Refresh page (or reload app)
  - [ ] All animations should be nearly instant (0.01ms)
  - [ ] Elements still transition/appear, just no animation
  - [ ] Verify in DevTools computed styles
  - [ ] Disable motion preference, confirm animations return
  - **Expected**: Animations respect OS accessibility settings

## 2. Desktop Testing (Firefox)

### 2.1 Animation Compatibility
- **Test Case**: All Animations Work in Firefox
  - [ ] Repeat tests 1.1-1.7 in Firefox
  - [ ] Compare smoothness to Chrome
  - [ ] Check for any visual differences
  - [ ] Verify cubic-bezier animations work
  - **Expected**: Same quality as Chrome, smooth animations

### 2.2 CSS Support
- [ ] Verify `-webkit-` prefixes not needed for FF
  - [ ] `animation` property works without prefix
  - [ ] `transform` works without prefix
  - [ ] `opacity` works without prefix
  - **Expected**: Standard CSS properties work

## 3. Desktop Testing (Safari)

### 3.1 Animation Compatibility
- **Test Case**: All Animations Work in Safari
  - [ ] Repeat tests 1.1-1.7 in Safari
  - [ ] Check for hardware acceleration
  - [ ] Look for any stuttering (common in Safari)
  - [ ] Verify animations are GPU-accelerated
  - **Expected**: Smooth performance, similar to other browsers

### 3.2 Web Standards
- [ ] CSS animations follow standard syntax
- [ ] No Safari-specific prefixes needed
- [ ] Cubic-bezier timing functions work
- **Expected**: No special handling needed

## 4. Mobile Testing (Chrome Mobile)

### 4.1 Responsive Animation Layout
- **Test Case**: Animations on Small Screen
  - [ ] Open Chrome mobile emulation (Pixel 5: 393x851)
  - [ ] Navigate through all screens
  - [ ] Verify animations work at small viewport
  - [ ] Confetti should still animate properly
  - [ ] Story reveal should work on mobile
  - [ ] No animations break layout
  - **Expected**: All animations functional on mobile

### 4.2 Touch Interactions
- **Test Case**: Button Press on Touch
  - [ ] Tap buttons on mobile
  - [ ] Observe press animation (scale 0.95)
  - [ ] Should respond to touch as well as mouse
  - [ ] No 300ms delay issues
  - **Expected**: Smooth touch response, tactile feel

### 4.3 Performance on Mobile
- [ ] Monitor CPU usage during confetti
- [ ] Check if animations cause battery drain
- [ ] Verify 60fps possible on mobile
- [ ] No excessive GPU usage
- **Expected**: Smooth animations, reasonable battery impact

### 4.4 Orientation Changes
- [ ] Start game in portrait
- [ ] Rotate to landscape
- [ ] Verify animations continue smoothly
- [ ] Layout adjusts properly
- [ ] No animation glitches on rotate
- **Expected**: Smooth orientation handling

## 5. Mobile Testing (iOS Safari)

### 5.1 iOS-Specific Animation Testing
- **Test Case**: Animations on iPhone/iPad
  - [ ] Open on iPhone (any model)
  - [ ] Check all animation transitions
  - [ ] Confetti should animate smoothly
  - [ ] Story reveal should display correctly
  - [ ] Pulse animation on waiting screen
  - **Expected**: Same quality as Android

### 5.2 iOS Performance
- [ ] Monitor Safari DevTools (if available)
- [ ] Check for battery drain during animations
- [ ] Verify GPU acceleration active
- [ ] Test on low-end iPhone (battery saver mode)
- **Expected**: Acceptable performance, no battery issues

### 5.3 iOS Motion Settings
- **Test Case**: Respect iOS Motion Preferences
  - [ ] Settings → Accessibility → Motion → Reduce Motion
  - [ ] Enable "Reduce Motion"
  - [ ] Refresh page
  - [ ] Animations should be nearly instant
  - [ ] Test with motion enabled (normal animations)
  - **Expected**: Respects iOS accessibility

## 6. Low-End Device Simulation

### 6.1 Throttling in DevTools
- **Test Case**: Performance on Slow Hardware
  - [ ] Chrome DevTools → Performance → CPU throttling
  - [ ] Set to "4x slowdown"
  - [ ] Navigate through game
  - [ ] Trigger confetti
  - [ ] Check if animations are still usable
  - [ ] May drop to 30fps, but should be smooth
  - **Expected**: Acceptable quality even on slow hardware

### 6.2 Network Throttling
- [ ] DevTools → Network → Fast 3G
- [ ] Load page with animations
- [ ] Verify CSS animations load first
- [ ] No delays in animation start
- **Expected**: Animations work during network loading

### 6.3 Memory Constraints
- [ ] Monitor memory usage during confetti
- [ ] Verify particles are cleaned up properly
- [ ] No memory leaks after animations complete
- [ ] Multiple animation cycles shouldn't accumulate
- **Expected**: Clean memory management

## 7. Edge Cases & Accessibility

### 7.1 Rapid Screen Navigation
- [ ] Click through screens quickly
- [ ] Multiple fade-in animations overlap
- [ ] Verify no animation queue issues
- [ ] UI remains responsive
- **Expected**: Graceful handling of rapid transitions

### 7.2 Rapid Confetti Trigger
- [ ] Complete game, see confetti
- [ ] Quickly click "Play Again"
- [ ] New game starts, potentially more confetti
- [ ] Verify no memory issues
- [ ] Previous confetti cleaned up
- **Expected**: No animation overlap issues

### 7.3 Browser Tab Hidden
- [ ] Start animation
- [ ] Switch tabs
- [ ] Switch back
- [ ] Animations should resume smoothly
- [ ] No glitches from requestAnimationFrame pause
- **Expected**: Smooth resume on tab visibility

### 7.4 Low Contrast Mode
- [ ] Enable high contrast in accessibility settings
- [ ] Verify animations still visible
- [ ] Colors adjust properly
- [ ] Glow effects still readable
- **Expected**: Animations respect high contrast mode

## 8. Detailed CSS Verification

### 8.1 Fade-In Animation
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in {
  animation: fadeIn 0.3s ease-in;
}
```
- [ ] Verify in DevTools computed styles
- [ ] translateY correctly transforms elements
- [ ] Easing is "ease-in" (accelerating)

### 8.2 Loading Spinner
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-spinner {
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}
```
- [ ] Cubic-bezier creates bouncy effect
- [ ] Rotation is smooth and complete
- [ ] Infinite loop works properly

### 8.3 Pulse Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```
- [ ] Opacity keyframes correct
- [ ] Timing matches 2 seconds
- [ ] Easing is smooth

### 8.4 Confetti Animation
```css
@keyframes confettiFall {
  to {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
.confetti {
  animation: confettiFall 3s linear forwards;
}
```
- [ ] translateY moves from top to bottom
- [ ] Rotation is 720 degrees (2 full rotations)
- [ ] Opacity fades to 0
- [ ] Linear timing for consistent fall speed

### 8.5 Story Reveal
```css
@keyframes storyReveal {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
.story-reveal {
  animation: storyReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calculated per sentence;
}
```
- [ ] Each sentence has `animation-delay: ${index * 0.1}s`
- [ ] Verifiable in DOM (style attribute on each story-reveal div)
- [ ] Keyframe easing is cubic-bezier

### 8.6 Active Player Glow
```css
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.4); }
  50% { box-shadow: 0 0 30px rgba(124, 58, 237, 0.8); }
}
.active-player-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}
```
- [ ] Box-shadow intensity pulses
- [ ] Color is purple with transparency
- [ ] Smooth easing (ease-in-out)

### 8.7 Button Press Effect
```css
.button-press {
  transition: transform 0.1s ease;
}
.button-press:active {
  transform: scale(0.95);
}
```
- [ ] Transition smooth (not jerky)
- [ ] Scale factor 0.95 (shrinks 5%)
- [ ] Duration 0.1s (feels instant to user)

### 8.8 Reduced Motion Query
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
- [ ] All animations reduced to 0.01ms
- [ ] All transitions reduced to 0.01ms
- [ ] Important flag prevents override
- [ ] Effectively disables all animations

## Test Results Template

### Animation Test Results

| Animation | Browser | Desktop | Mobile | Status | Notes |
|-----------|---------|---------|--------|--------|-------|
| Fade-In | Chrome | | | | |
| Fade-In | Firefox | | | | |
| Fade-In | Safari | | | | |
| Loading Spinner | Chrome | | | | |
| Loading Spinner | Firefox | | | | |
| Loading Spinner | Safari | | | | |
| Pulse | Chrome | | | | |
| Pulse | Firefox | | | | |
| Pulse | Safari | | | | |
| Confetti | Chrome | | | | |
| Confetti | Firefox | | | | |
| Confetti | Safari | | | | |
| Story Reveal | Chrome | | | | |
| Story Reveal | Firefox | | | | |
| Story Reveal | Safari | | | | |
| Button Effects | Chrome | | | | |
| Button Effects | Firefox | | | | |
| Button Effects | Safari | | | | |
| Glow Effect | Chrome | | | | |
| Glow Effect | Firefox | | | | |
| Glow Effect | Safari | | | | |
| Reduced Motion | Chrome | | | | |
| Reduced Motion | Firefox | | | | |
| Reduced Motion | Safari | | | | |
| Performance (60fps) | Chrome | | | | |
| Performance (60fps) | Firefox | | | | |
| Performance (60fps) | Safari | | | | |

**Status Values**: Pass, Fail, Partial, N/A
**Notes**: Any issues, workarounds, or special observations

## Known Issues & Limitations

- Mobile performance may vary based on device capability
- Low-end Android devices may drop to 30fps during confetti
- iOS Safari may have slightly different timing due to browser differences
- Very rapid screen transitions may queue animations

## Recommendations

1. **Performance Priority**: Focus on 60fps during confetti animation
2. **Accessibility**: Always test with reduced-motion enabled
3. **Mobile First**: Test on actual mobile devices, not just emulators
4. **Browser Coverage**: Minimum support: Chrome 90+, Firefox 88+, Safari 14+
5. **Regular Testing**: Retest after any CSS changes

## Sign-Off

- **Tester Name**: _______________
- **Date**: _______________
- **Overall Status**: PASS / PARTIAL / FAIL
- **Critical Issues**: None / [List issues]
- **Recommendations**: [Any follow-up needed]
