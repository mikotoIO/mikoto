# Tab Behavior in Mikoto

## Overview

This document describes how tab behavior works in the Mikoto client, particularly how clicking on explorer nodes interacts with the tabbed interface.

## Explorer Node Click Behavior

When clicking on an explorer node (e.g., a channel in the space sidebar):

1. **Ctrl+Click** (on any node):

   - Always opens the node in a new tab, regardless of existing tabs
   - Useful for deliberately creating multiple instances of the same panel

2. **Regular Click** (when no tabs exist):

   - Opens the node in the first tab
   - This is the default behavior when starting the application

3. **Regular Click** (when tabs already exist):
   - Always opens the clicked node in a new tab
   - This allows having multiple different panels open at once
   - Creates a multi-panel workflow where each click adds a new panel

## Technical Implementation

The tab behavior is implemented through two main components:

1. **Explorer Component** (`components/surfaces/Explorer/index.tsx`):

   - Handles node clicks and determines whether to create a new tab
   - Uses a simple rule: if tabs exist or Ctrl is pressed, create a new tab

2. **DockViewSurface Component** (`components/DockViewSurface.tsx`):
   - Monitors changes to the tabs array
   - Creates new panels when new tabs are added
   - Manages the active panel based on the activeTabId
   - Keeps track of previously processed tabs to prevent duplicate panels

The state management occurs through:

- Recoil atoms for tab state
- A tabs array that maps to panels in the DockView
- The tabkit utility for tab operations

## Benefits

- **Progressive Interface**: Starts with a clean single-panel workspace and evolves into a multi-panel interface
- **Intuitive Workflow**: Initial click opens first tab, subsequent clicks add new panels
- **Explicit Control**: Ctrl+click provides consistent behavior for creating new tabs
- **Responsive Layout**: DockView handles panel arrangement and resizing automatically

This approach creates a natural workflow where the interface complexity grows with user interaction, starting simple and becoming more powerful as needed.
