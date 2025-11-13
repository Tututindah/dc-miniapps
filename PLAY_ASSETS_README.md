# Dragon City - Play/Hangout Zone Assets & Controls

## 🐉 Dragon Assets

Located in `public/assets/dragons/`:

- **dragon-idle.svg** - Blue dragon character sprite (128x128)
  - Used as player character in the game
  - Features: wings, horns, tail, claws
  - Color scheme: Blue gradient with purple wings and red accents

## 🌋 Terrain Assets

Located in `public/assets/terrain/`:

### Ground Dirt Texture (`ground-dirt.svg`)
- **Size**: 400x200px tileable pattern
- **Style**: Cartoon dirt ground layer
- **Features**: 
  - Brown dirt base with darker/lighter patches
  - Small rocks scattered
  - Grass sprouts on top edge
  - Horizontal depth lines
  - Seamless tiling pattern

### Lava Background (`lava-background.svg`)
- **Size**: 400x300px
- **Style**: Volcanic landscape
- **Features**:
  - Dark gradient sky (brown to reddish)
  - Mountain/rock silhouettes
  - Animated lava river with bubbles
  - Glowing effects
  - Rock platforms
  - Steam/smoke particles
  - All with CSS animations

## 📱 Mobile Controls

### Virtual Joystick (Left Side)
- **Purpose**: Movement control
- **Features**:
  - 360-degree directional input
  - Left/Right movement detection
  - Jump when pushed up
  - Visual feedback with knob position
  - Touch and mouse support
  - Dead zone for neutral position

### Action Buttons (Right Side)

1. **Attack Button (⚔️)**
   - Large red circular button
   - Press and hold to attack
   - Visual feedback when pressed
   - Dual-purpose: Attack in combat

2. **Speak/Chat Button (💬/🔊)**
   - Medium blue/green button
   - Toggle on/off
   - Shows speaking indicator when active
   - Future: Voice chat integration

3. **Jump Button (⬆️)**
   - Yellow circular button
   - Tap to jump
   - Alternative to joystick up

### Weapon Selector
- **Location**: Top right on mobile
- **Options**: 
  - 👊 Fist (default)
  - ⚔️ Sword
  - 🏹 Bow
  - 🪄 Staff
- **Interaction**: Tap to switch weapons

## 🖥️ Desktop Controls

### Keyboard Shortcuts
- **A/D** or **←/→**: Move left/right
- **Space/W/↑**: Jump
- **E**: Attack
- **1-4**: Switch weapon (Fist, Sword, Bow, Staff)

## 📐 Responsive Design

### Mobile (< 640px)
- Compact UI elements
- Virtual joystick and buttons visible
- Simplified health/weapon display
- Hidden performance stats
- Weapon selector at top right
- Full-screen gameplay

### Tablet (640px - 1024px)
- Medium-sized controls
- Adaptive button sizes
- Optimized touch targets
- Balanced UI spacing

### Desktop (> 1024px)
- Keyboard controls only
- Full stats display
- Larger UI elements
- No virtual controls
- Extended control legend

## 🎨 Visual Features

### Loading Screen
- Animated dragon sprite (bounce effect)
- Purple glow effect
- Pulsing dots indicator
- Themed background gradient

### Speaking Indicator
- Centered overlay when speaking
- Animated sound bars
- Semi-transparent background
- Auto-hides when not speaking

### Health Bar
- Gradient red design
- Smooth transitions
- Numeric display (current/max)
- Compact on mobile

### Terrain Integration
- Layered backgrounds (sky → lava → ground)
- Parallax-ready structure
- Z-index organization
- Overlay filters for depth

## 🔧 Technical Implementation

### Touch Events
```typescript
onTouchStart - Activates joystick/button
onTouchMove - Updates joystick position
onTouchEnd - Releases control
```

### Mouse Events (Desktop Testing)
```typescript
onMouseDown - Same as touch start
onMouseMove - Same as touch move
onMouseUp - Same as touch end
onMouseLeave - Auto-release on exit
```

### State Management
- `isMobile` - Auto-detects touch capability
- `joystickActive` - Tracks joystick engagement
- `joystickPosition` - X/Y coordinates
- `attackPressed` - Button press state
- `isSpeaking` - Voice chat state

## 🚀 Usage

The WASMGame component automatically:
1. Detects mobile vs desktop
2. Shows appropriate controls
3. Loads dragon and terrain assets
4. Provides responsive layout
5. Handles all input methods

No configuration needed - just import and use:

```tsx
import WASMGame from '@/components/WASMGame';

<WASMGame playerName="DragonSlayer" roomId="lava-arena" />
```

## 📝 Future Enhancements

- [ ] Voice chat integration for speak button
- [ ] More dragon sprite variations
- [ ] Animated dragon movements (walk, attack, jump)
- [ ] Additional terrain themes
- [ ] Haptic feedback on mobile
- [ ] Customizable control positions
- [ ] Controller support
- [ ] Multiplayer chat overlay
